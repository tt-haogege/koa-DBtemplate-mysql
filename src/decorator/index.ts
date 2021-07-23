import Router from '@koa/router'
import { Middleware } from 'koa'
const fs = require('fs')
const { resolve } = require('path')
export interface BoundedMiddleware extends Middleware {
    readonly original?: Middleware
}

export interface Route {
    handler: BoundedMiddleware | BoundedMiddleware[]
    method: Array<Method | undefined>
    path: Path
}

// eslint-disable-next-line @typescript-eslint/no-type-alias, @typescript-eslint/no-explicit-any
export type Target = any // type-coverage:ignore-line

export type Routes = Route[] & { path: Path }

const routesList: Routes[] = []

export enum Method {
    ALL = 'all',
    DELETE = 'delete',
    GET = 'get',
    HEAD = 'head',
    OPTIONS = 'options',
    PATCH = 'patch',
    POST = 'post',
    PUT = 'put',
}

export type Path = string | RegExp
export interface RequestMap {
    method?: Method | Method[]
    path?: Path
}

export type Decorator = ClassDecorator | MethodDecorator | PropertyDecorator

export type RequestMappingDecorator = (
    target: Target,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
) => void

export const RoutesKey = Symbol('routes')

// 将当前 routesList 中所有路由注入指定的 router 中
export const injectAllRoutes = <T, R>(router: Router<T, R>) => {
    while (routesList.length) {
        const routes = routesList.shift()!
        routes.forEach(({ handler, method, path = '' }) => {
            if (typeof routes.path === 'string' && typeof path === 'string') {
                path = routes.path + path
            }

            method.forEach(m =>
                router[m || Method.GET](
                    path,
                    ...(Array.isArray(handler) ? handler : [handler]),
                ),
            )
        })
    }
}

// 路由控制器，添加到 class 声明上
export const Controller = (prefix: string | undefined) => {
    return (target: Target) => {
        if (prefix) {
            if (!prefix.startsWith('/')) {
                prefix = '/' + prefix
            }
        } else {
            prefix = '/'
        }
        
        // type-coverage:ignore-next-line
        target.prototype[RoutesKey].forEach((item: Route) => {
            item.path = (prefix || '') + item.path
        });
        routesList.push(target.prototype[RoutesKey])
    }
}
// 路由 url 匹配规则，添加到类成员方法上
function RequestMapping(requestMap: RequestMap): RequestMappingDecorator
function RequestMapping(
    path?: Path,
    method?: Method | Method[],
): RequestMappingDecorator
// eslint-disable-next-line sonarjs/cognitive-complexity
function RequestMapping(path?: Path | RequestMap, method?: Method | Method[]) {
    if (typeof path === 'string' || path instanceof RegExp) {
        path = {
            method,
            path,
        }
    } else if (method !== undefined) {
        console.warn('method should not be passed in')
    }
    const requestMap: RequestMap = path || {}

    const requestMethod = requestMap.method
    const requestMethods = Array.isArray(requestMethod)
        ? requestMethod
        : [requestMethod]

    const requestPath = requestMap.path!

    return (
        target: Target,
        propertyKey?: string | symbol,
        descriptor?: PropertyDescriptor,
    ): void => {
        // type-coverage:ignore-next-line
        target = propertyKey ? target : target.prototype
        if (!target[RoutesKey]) {
            target[RoutesKey] = []
        }

        const routes: Routes = target[RoutesKey]

        if (propertyKey) {
            descriptor =
                descriptor || Object.getOwnPropertyDescriptor(target, propertyKey)
            if (!descriptor || typeof descriptor.value !== 'function') {
                if (process.env.NODE_ENV === 'development') {
                    console.warn('invalid usage of decorator `RequestMapping`')
                }
                return
            }

            const original: Middleware = descriptor.value
            routes.push({
                handler: Object.assign(original.bind(target), { original }),
                method: requestMethods,
                path: requestPath,
            })
            return
        }

        if (requestMethod) {
            routes.forEach(
                route =>
                    (route.method = route.method[0] ? route.method : requestMethods),
            )
        }

        routes.path = requestPath as string
    }
}
export default (router: Router, controllerPath: string) => {
    let loadCtroller = (rootPaths: string) => {
        try {
            var allfile = fs.readdirSync(rootPaths);
             //加载目录下的所有文件进行遍历
            allfile.forEach((file: string) => {
                var filePath = resolve(rootPaths, file)// 获取遍历文件的路径
                if (fs.lstatSync(filePath).isDirectory()) { //判断该文件是否是文件夹，如果是递归继续遍历读取文件
                    loadCtroller(filePath)
                } else {
                    let mod = require(filePath);
                }
            })
        } catch (error) {
            console.log(error)
            console.log("no such file or dir :---- " + rootPaths)
        }
    }
    loadCtroller(controllerPath);
    injectAllRoutes(router)
}
export function get(url: string) {
    return RequestMapping(url, Method.GET)
}
export function post(url: string) {
    return RequestMapping(url, Method.POST)
}
export function put(url: string) {
    return RequestMapping(url, Method.PUT)
}
export function del(url: string) {
    return RequestMapping(url, Method.DELETE)
}
export function all(url: string) {
    return RequestMapping(url, Method.ALL)
}

export { RequestMapping }
