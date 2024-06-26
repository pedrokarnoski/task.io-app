import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { getUser } from '@/api/get-user'
import { updateProfile } from '@/api/update-profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useToast } from '@/components/ui/use-toast'
import { axiosErrorHandler } from '@/utils/axiosErrorHandler'

const userProfileSchema = z
  .object({
    name: z.string().min(3, { message: 'Digite o nome completo.' }),
    username: z.string(),
    oldPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
      .regex(/[A-Z]/, {
        message: 'A senha deve conter pelo menos uma letra maiúscula.',
      })
      .regex(/[0-9]/, { message: 'A senha deve conter pelo menos um número.' })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.oldPassword) {
        return data.newPassword && data.newPassword?.length > 0
      }
      return true
    },
    {
      message: 'Nova senha é obrigatória se a senha antiga for fornecida',
      path: ['newPassword'],
    },
  )

type UserProfileSchema = z.infer<typeof userProfileSchema>

export function UserProfileSheet() {
  const { toast } = useToast()

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
    staleTime: Infinity,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserProfileSchema>({
    resolver: zodResolver(userProfileSchema),
    values: {
      name: user?.name ?? '',
      username: user?.username ?? '',
    },
  })

  const { mutateAsync: updateProfileFn } = useMutation({
    mutationFn: updateProfile,
  })

  async function handleUpdateProfile(data: UserProfileSchema) {
    try {
      await updateProfileFn({
        id: user?.id ?? 0,
        name: data.name,
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      })

      toast({
        variant: 'default',
        title: 'Perfil',
        description: 'Perfil atualizado com sucesso!',
      })
    } catch (error) {
      const errorMessage = axiosErrorHandler(error)

      toast({
        variant: 'destructive',
        title: 'Perfil',
        description: errorMessage,
      })
    }
  }

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Editar perfil</SheetTitle>
        <SheetDescription>
          Faça alterações em seu perfil aqui. Clique em salvar quando terminar.
        </SheetDescription>
      </SheetHeader>

      <form onSubmit={handleSubmit(handleUpdateProfile)}>
        <div className="items-center space-y-2 pt-8">
          <div className="grid grid-cols-2 items-center gap-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input className="col-span-3" id="name" {...register('name')} />
          </div>

          <div className="items-center space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              disabled={true}
              className="col-span-3"
              id="username"
              {...register('username')}
            />
          </div>

          <div className="items-center space-y-2">
            <Label htmlFor="oldPassword">Senha antiga</Label>
            <PasswordInput
              className="col-span-3"
              id="oldPassword"
              {...register('oldPassword')}
            />
          </div>
          {errors.oldPassword && (
            <p className="text-sm text-red-500">{errors.oldPassword.message}</p>
          )}

          <div className="items-center space-y-2 pb-8">
            <Label htmlFor="newPassword">Nova senha</Label>
            <PasswordInput
              className="col-span-3"
              id="newPassword"
              {...register('newPassword')}
            />
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-500">{errors.newPassword.message}</p>
          )}
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="ghost" type="button" onClick={() => reset()}>
              Cancelar
            </Button>
          </SheetClose>
          <Button type="submit" disabled={isSubmitting}>
            Salvar
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  )
}
