import { z } from 'zod';

// using ZOD enum for strict typing
export const UserRoleSchema = z.enum(['customer', 'employee', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// schema of the shared fields
const BaseSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(8, "Password must be 8+ characters"),
});

// conditional schema based on roles
export const RegisterSchema = z.discriminatedUnion("role", [
  // customer
  BaseSchema.extend({
    role: z.literal("customer"),
    deliveryAddress: z.string().min(5, "Full delivery address is required"),
  }),
  // Employee
  BaseSchema.extend({
    role: z.literal("employee"),
    employeeId: z.string().min(3, "Valid Employee ID is required"),
  }),
]);

export type RegisterInput = z.infer<typeof RegisterSchema>;

// our login Schema
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof LoginSchema>;