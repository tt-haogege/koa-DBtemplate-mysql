import { Controller, Method, RequestMapping } from '../decorator/index'
import * as Koa from 'koa'
@Controller('/a')
export default class startApi {
    @RequestMapping('/ee', Method.GET)
    async getIndex(ctx: Koa.Context, next: Function) {
        ctx.body = {
            a : 66666
        }
    }
    @RequestMapping('/stringe', Method.GET)
    async getString(ctx: Koa.Context, next: Function) {
        ctx.body = 'koa2 string'
    }
}
