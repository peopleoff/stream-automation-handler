<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";

import * as z from "zod";

useHead({
  title: "Login - CattyShack Automation",
  meta: [
    {
      name: "description",
      content: "Sign in to your shop automation control panel",
    },
  ],
});

const toast = useToast();
const router = useRouter();
const isLoading = ref(false);

const fields = [{
  name: "email",
  type: "text" as const,
  label: "Email",
  placeholder: "Enter your email",
  required: true,
}, {
  name: "password",
  label: "Password",
  type: "password" as const,
  placeholder: "Enter your password",
}, {
  name: "remember",
  label: "Remember me",
  type: "checkbox" as const,
}];

const schema = z.object({
  email: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

type Schema = z.output<typeof schema>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  isLoading.value = true;

  try {
    // Simulate API call - replace with actual authentication
    console.warn("Login attempt:", payload.data);
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.add({
      title: "Login Successful",
      description: "Welcome to your automation control panel",
      color: "success",
    });

    // Redirect to dashboard (placeholder for now)
    await router.push("/dashboard");
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Please check your credentials and try again";
    toast.add({
      title: "Login Failed",
      description: message,
      color: "error",
    });
  }
  finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UMain class="flex-1 flex items-center justify-center p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Shop Owner Login"
        description="Access your automation control panel"
        icon="i-lucide-store"
        :fields="fields"
        :submit="{
          label: 'Sign In',
          block: true,
          loading: isLoading,
        }"
        @submit="onSubmit"
      >
        <template #footer>
          <p class="text-sm text-center text-muted">
            Need access? Contact your system administrator.
          </p>
        </template>
      </UAuthForm>
    </UPageCard>
  </UMain>
</template>
