import type { InsertUser } from "@/lib/schema";
import { MILITARY_RANKS, CLEARANCE_LEVELS, insertUserSchema } from "@/lib/schema";
import { PERMISSIONS } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    write_products: "Products",
    write_locations: "Locations",
    write_users: "Users",
    delete_products: "Products",
    delete_locations: "Locations",
    delete_users: "Users",
};

type UserFormProps = {
    onSubmit: (data: InsertUser) => void;
    defaultValues?: Partial<InsertUser>;
    isEdit?: boolean;
    isPending?: boolean;
};

export default function UserForm({
                                     onSubmit,
                                     defaultValues,
                                     isEdit,
                                     isPending,
                                 }: UserFormProps) {
    const form = useForm<InsertUser>({
        resolver: zodResolver(insertUserSchema) as any,
        defaultValues: {
            username: "",
            password: "",
            full_name: "",
            rank: "",
            unit: "",
            callsign: "",
            clearanceLevel: "No clearance",
            permissions: [],
            isActive: true,
            ...defaultValues,
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input {...field} />
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
                            <FormLabel>{isEdit ? "New password (optional)" : "Password"}</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full name</FormLabel>
                            <FormControl>
                                <Input {...field} />
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                <Input {...field} />
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
                            <FormLabel>Callsign</FormLabel>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    render={({ field }) => (
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
                                                const current = (field.value ?? []) as Permission[];
                                                const checked = current.includes(perm);

                                                return (
                                                    <label
                                                        key={perm}
                                                        className="flex cursor-pointer select-none items-center gap-2 text-sm"
                                                    >
                                                        <Checkbox
                                                            checked={checked}
                                                            onCheckedChange={(value) => {
                                                                const next = value
                                                                    ? [...current, perm]
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
                    )}
                />

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-md border p-3">
                            <FormLabel className="mb-0">Active</FormLabel>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isEdit ? "Saving..." : "Creating..."}
                        </>
                    ) : isEdit ? "Save changes" : "Create user"}
                </Button>
            </form>
        </Form>
    );
}