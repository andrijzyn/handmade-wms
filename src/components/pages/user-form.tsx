"use client";

import type { InsertUser, UpdateUser } from "@/lib/schema";
import {
  MILITARY_RANKS,
  CLEARANCE_LEVELS,
  insertUserSchema,
  updateUserSchema,
} from "@/lib/schema";
import { PERMISSIONS } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const PERMISSION_GROUPS: { label: string; perms: Permission[] }[] = [
  {
    label: "Read",
    perms: [
      PERMISSIONS.READ_PRODUCTS,
      PERMISSIONS.READ_LOCATIONS,
      PERMISSIONS.READ_USERS,
      PERMISSIONS.READ_DEBUG,
    ],
  },
  {
    label: "Write",
    perms: [
      PERMISSIONS.WRITE_PRODUCTS,
      PERMISSIONS.WRITE_LOCATIONS,
      PERMISSIONS.WRITE_USERS,
    ],
  },
  {
    label: "Delete",
    perms: [
      PERMISSIONS.DELETE_PRODUCTS,
      PERMISSIONS.DELETE_LOCATIONS,
      PERMISSIONS.DELETE_USERS,
    ],
  },
];

const PERMISSION_LABELS: Record<Permission, string> = {
  read_products: "Products",
  read_locations: "Locations",
  read_users: "Users",
  read_debug: "Debug",
  read_logs: "Logs",
  write_products: "Products",
  write_locations: "Locations",
  write_users: "Users",
  delete_products: "Products",
  delete_locations: "Locations",
  delete_users: "Users",
};

type UserFormValues = {
  username: string;
  password: string;
  fullName: string;
  rank: string;
  unit: string;
  callsign: string;
  clearanceLevel: string;
  permissions: Permission[];
  isActive: boolean;
};

type CreateUserFormProps = {
  isEdit?: false;
  onSubmit: (data: InsertUser) => void;
  defaultValues?: Partial<InsertUser>;
  isPending?: boolean;
};

type EditUserFormProps = {
  isEdit: true;
  onSubmit: (data: UpdateUser) => void;
  defaultValues?: Partial<UpdateUser>;
  isPending?: boolean;
};

type UserFormProps = CreateUserFormProps | EditUserFormProps;

export default function UserForm(props: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(
      props.isEdit ? updateUserSchema : insertUserSchema
    ) as any,
    defaultValues: {
      username: props.defaultValues?.username ?? "",
      password: "",
      fullName: props.defaultValues?.fullName ?? "",
      rank: props.defaultValues?.rank ?? "",
      unit: props.defaultValues?.unit ?? "",
      callsign:
        typeof props.defaultValues?.callsign === "string"
          ? props.defaultValues.callsign
          : "",
      clearanceLevel: props.defaultValues?.clearanceLevel ?? "No clearance",
      permissions: props.defaultValues?.permissions ?? [],
      isActive: props.defaultValues?.isActive ?? true,
    },
  });

function handleSubmit(data: UserFormValues) {
  const password = data.password?.trim();
  const basePayload = {
    username: data.username.trim(),
    fullName: data.fullName.trim(),
    rank: data.rank,
    unit: data.unit,
    callsign: data.callsign?.trim() || null,
    clearanceLevel: data.clearanceLevel,
    permissions: data.permissions,
    isActive: data.isActive,
  };

  if (props.isEdit) {
    props.onSubmit({
      ...basePayload,
      ...(password ? { password } : {}),
    });
    return;
  }

  props.onSubmit({
    ...basePayload,
    password: password ?? "",
  });
}

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {props.isEdit ? "New password (optional)" : "Password"}
              </FormLabel>
              <FormControl>
                <Input type="password" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rank</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MILITARY_RANKS.map((rank) => (
                    <SelectItem key={rank} value={rank}>
                      {rank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="callsign"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Call sign</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clearanceLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clearance level</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CLEARANCE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="permissions"
          render={({ field }) => {
            const current = field.value ?? [];

            return (
              <FormItem>
                <FormLabel>Permissions</FormLabel>
                <div className="space-y-3 rounded-md border p-3">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {group.label}
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {group.perms.map((perm) => {
                          const checked = current.includes(perm);

                          return (
                            <label
                              key={perm}
                              className="flex cursor-pointer select-none items-center gap-2 text-sm"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => {
                                  const next =
                                    value === true
                                      ? Array.from(new Set([...current, perm]))
                                      : current.filter((p) => p !== perm);

                                  field.onChange(next);
                                }}
                              />
                              {PERMISSION_LABELS[perm]}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border p-3">
              <FormLabel className="mb-0">Active</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={props.isPending}>
          {props.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {props.isEdit ? "Saving..." : "Creating..."}
            </>
          ) : props.isEdit ? (
            "Save changes"
          ) : (
            "Create user"
          )}
        </Button>
      </form>
    </Form>
  );
}
