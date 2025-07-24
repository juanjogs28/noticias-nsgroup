"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
  useForm,
} from "react-hook-form"

import { cn } from "@/lib/utils" // asegurate de tener esta función o reemplazala por una clase fija
import { Label } from "@/components/ui/label" // o directamente usá <label> si no lo usás

// -------------------------- COMPONENTES DE FORMULARIO --------------------------

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

// -------------------------- FORMULARIO DE SUSCRIPCIÓN --------------------------

type FormData = {
  email: string
  country: string
  sector: string
}

export default function SubscribeForm() {
  const form = useForm<FormData>({
    defaultValues: {
      email: "",
      country: "",
      sector: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch("http://localhost:3001/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
          localStorage.setItem("userCountry", data.country)
          localStorage.setItem("userSector", data.sector)
        alert("✅ Suscripción exitosa")
        form.reset()
      } else {
        alert("⚠️ " + result.message)
      }
    } catch (error) {
      console.error("❌ Error:", error)
      alert("❌ Error al enviar el formulario")
    }
  }

  

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md mx-auto">

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          rules={{
            required: "Email es requerido",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Formato de email inválido",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  {...field}
                  className="w-full border rounded px-3 py-2"
                />
              </FormControl>
              <FormDescription>Ingresá tu correo electrónico.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* País */}
        <FormField
          control={form.control}
          name="country"
          rules={{ required: "El país es obligatorio" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>País</FormLabel>
              <FormControl>
                <select {...field} className="w-full border rounded px-3 py-2">
                  <option value="">Seleccioná un país</option>
                  <option value="uruguay">Uruguay</option>
                  <option value="argentina">Argentina</option>
                  <option value="chile">Chile</option>
                  <option value="mexico">México</option>
                </select>
              </FormControl>
              <FormDescription>Tu país de residencia.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sector de noticias */}
        <FormField
          control={form.control}
          name="sector"
          rules={{ required: "Seleccioná un sector" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sector de Noticias</FormLabel>
              <FormControl>
                <select {...field} className="w-full border rounded px-3 py-2">
                  <option value="">Seleccioná un sector</option>
                  <option value="tecnologia">Tecnología</option>
                  <option value="salud">Salud</option>
                  <option value="deportes">Deportes</option>
                  <option value="negocios">Negocios</option>
                </select>
              </FormControl>
              <FormDescription>¿Qué tipo de noticias te interesa?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Suscribirse
        </button>
      </form>
    </Form>
  )
}
