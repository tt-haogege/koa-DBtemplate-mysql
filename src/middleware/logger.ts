import * as Koa from "koa"
const logger  = async (ctx: Koa.Context, next: Function) => {
    const start: number = new Date().getTime()
    await next()
    const ms: number = new Date().getTime() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
}
export default logger
