import { Controller, get, post } from 'koa-router-decorators-up'
import { Context, Next } from 'koa';
import { User } from '../mysql/entity/user'
import { getManager } from 'typeorm';
@Controller('/user')
export default class user {
    @post('/add')
    async getIndex(ctx: Context, next: Next) {
        const userSchema =  getManager().getRepository(User)
        const { name, password, email }: {
            name: string,
            password: string,
            email: string
            // @ts-ignore body不在request的定义上屏蔽此错误
        } = ctx.request.body
        //在正常开发中密码建议加密保存
        const newUser = new User()
        newUser.name = name
        newUser.email = email
        newUser.password = password
        // 保存到数据库
        const user = await userSchema.save(newUser);
        if (user) {
            ctx.body = {
                user
            }
        } else {
            ctx.body = {
                msg: '出错了'
            }
        }
    }
    @get('/findalluser')
    async getString(ctx: Context, next: Next) {
        const userSchema =  getManager().getRepository(User)
        const userList: any = await userSchema.find()
        if (userList) {
            ctx.body = {
                userList
            }
        }
    }
}
