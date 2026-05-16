"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { SafeUser, InsertUser } from "@/lib/schema";
import { MILITARY_RANKS, CLEARANCE_LEVELS, insertUserSchema } from "@/lib/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Pencil, Trash2, ShieldCheck, ShieldAlert, Users, Loader2 } from "lucide-react";

function clearanceBadgeVariant(level: string) {
  switch (level) {
    case "Highly confidential": return "destructive";
    case "Top secret": return "destructive";
    case "Secret": return "default";
    case "For official use": return "secondary";
    default: return "outline";
  }
}

function UserForm({
  onSubmit, defaultValues, isEdit, isPending,
}: {
  onSubmit: (data: InsertUser) => void;
  defaultValues?: Partial<InsertUser>;
  isEdit?: boolean;
  isPending?: boolean;
}) {
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema) as any,
    defaultValues: {
      username: "", password: "", fullName: "", rank: "", unit: "",
      callsign: "", clearanceLevel: "No clearance", role: "user", isActive: true,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="username" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Username</FormLabel>
              <FormControl><Input placeholder="login" data-testid="input-user-username" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">{isEdit ? "New password (optional)" : "Password"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder={isEdit ? "Leave empty to keep current" : "Password"} data-testid="input-user-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="fullName" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Full name</FormLabel>
            <FormControl><Input placeholder="Last First Middle" data-testid="input-user-fullname" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="rank" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Rank</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-user-rank"><SelectValue placeholder="Select rank" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MILITARY_RANKS.map((rank) => (<SelectItem key={rank} value={rank}>{rank}</SelectItem>))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="unit" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Unit</FormLabel>
              <FormControl><Input placeholder="Unit name" data-testid="input-user-unit" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="callsign" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Callsign</FormLabel>
              <FormControl><Input placeholder="Optional" data-testid="input-user-callsign" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="clearanceLevel" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Clearance level</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-user-clearance"><SelectValue placeholder="Select clearance" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CLEARANCE_LEVELS.map((level) => (<SelectItem key={level} value={level}>{level}</SelectItem>))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="role" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-user-role"><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="isActive" render={({ field }) => (
            <FormItem className="flex items-end gap-3 pb-2">
              <FormLabel className="text-xs mb-0.5">Active</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-user-active" />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-user">
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEdit ? "Saving..." : "Creating..."}</>
          ) : (
            isEdit ? "Save changes" : "Create user"
          )}
        </Button>
      </form>
    </Form>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<SafeUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SafeUser | null>(null);

  const { data: users = [], isLoading } = useQuery<SafeUser[]>({ queryKey: ["/api/users"] });

  const createMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/users", data);
      return await res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); setDialogOpen(false); toast({ title: "User created" }); },
    onError: (error: Error) => { toast({ variant: "destructive", title: "Error", description: error.message }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertUser> }) => {
      const payload = { ...data };
      if (!payload.password) delete payload.password;
      const res = await apiRequest("PATCH", `/api/users/${id}`, payload);
      return await res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); setEditUser(null); toast({ title: "Changes saved" }); },
    onError: (error: Error) => { toast({ variant: "destructive", title: "Error", description: error.message }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/users/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); setDeleteTarget(null); toast({ title: "User deleted" }); },
    onError: (error: Error) => { toast({ variant: "destructive", title: "Error", description: error.message }); },
  });

  const activeCount = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" data-testid="text-page-title">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage accounts and clearances</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" data-testid="button-add-user">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Add
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div><p className="text-xs text-muted-foreground">Total</p><p className="text-lg font-semibold" data-testid="text-total-users">{users.length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <div><p className="text-xs text-muted-foreground">Active</p><p className="text-lg font-semibold" data-testid="text-active-users">{activeCount}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">Admins</p><p className="text-lg font-semibold" data-testid="text-admin-count">{adminCount}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Full name</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Callsign</TableHead>
                  <TableHead>Clearance</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                    <TableCell>
                      <div><p className="font-medium text-sm">{u.fullName}</p><p className="text-xs text-muted-foreground">@{u.username}</p></div>
                    </TableCell>
                    <TableCell className="text-sm">{u.rank}</TableCell>
                    <TableCell className="text-sm">{u.unit}</TableCell>
                    <TableCell className="text-sm">{u.callsign || "—"}</TableCell>
                    <TableCell><Badge variant={clearanceBadgeVariant(u.clearanceLevel)} className="text-xs whitespace-nowrap">{u.clearanceLevel}</Badge></TableCell>
                    <TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">{u.role === "admin" ? "Admin" : "User"}</Badge></TableCell>
                    <TableCell className="text-center"><span className={`inline-block w-2 h-2 rounded-full ${u.isActive ? "bg-green-500" : "bg-red-400"}`} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditUser(u)} data-testid={`button-edit-user-${u.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                        {currentUser?.id !== u.id && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(u)} data-testid={`button-delete-user-${u.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[480px]"><DialogHeader><DialogTitle>New user</DialogTitle><DialogDescription>Create a new user account</DialogDescription></DialogHeader>
          <UserForm onSubmit={(data) => createMutation.mutate(data)} isPending={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-[480px]"><DialogHeader><DialogTitle>Edit: {editUser?.fullName}</DialogTitle></DialogHeader>
          {editUser && (
            <UserForm isEdit defaultValues={{
              username: editUser.username, password: "", fullName: editUser.fullName,
              rank: editUser.rank, unit: editUser.unit, callsign: editUser.callsign ?? "",
              clearanceLevel: editUser.clearanceLevel as typeof CLEARANCE_LEVELS[number],
              role: editUser.role as "admin" | "user", isActive: editUser.isActive,
            }} onSubmit={(data) => updateMutation.mutate({ id: editUser.id, data })} isPending={updateMutation.isPending} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.fullName}</strong> (@{deleteTarget?.username})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} data-testid="button-confirm-delete">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}