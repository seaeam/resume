import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { SignUpWithEmail } from '@/lib/supabase/user'
import { cn } from '@/lib/utils'

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== repeatPassword) {
      setError('两次输入的密码不匹配')
      return
    }
    setIsLoading(true)

    try {
      await SignUpWithEmail(email, password)
      setSuccess(true)
    }
    catch (error: unknown) {
      setError(error instanceof Error ? error.message : '发生错误')
    }
    finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {success
        ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">感谢您的注册！</CardTitle>
                <CardDescription>请检查您的电子邮件以确认</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  您已成功注册。请检查您的电子邮件以确认您的帐户，然后再登录。
                </p>
              </CardContent>
            </Card>
          )
        : (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">注册</CardTitle>
                <CardDescription>创建一个新帐户</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp}>
                  <FieldGroup className="gap-6">
                    <Field>
                      <FieldLabel htmlFor="email">邮箱</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="password">密码</FieldLabel>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="repeat-password">确认您的密码</FieldLabel>
                      <Input
                        id="repeat-password"
                        type="password"
                        required
                        value={repeatPassword}
                        onChange={e => setRepeatPassword(e.target.value)}
                      />
                    </Field>
                    {error && <FieldError>{error}</FieldError>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Spinner data-icon="inline-start" />}
                      {isLoading ? '创建账户中...' : '注册'}
                    </Button>
                  </FieldGroup>
                  <div className="mt-4 text-center text-sm">
                    已有账号？
                    <Link to="/login" className="underline underline-offset-4">
                      登录
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
    </div>
  )
}
