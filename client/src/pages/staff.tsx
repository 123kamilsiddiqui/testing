import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertStaffBookSchema, type InsertStaffBook, type StaffBook } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2 } from "lucide-react";

export default function StaffPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staffBooks = [], isLoading } = useQuery<StaffBook[]>({
    queryKey: ["/api/staff-book"],
  });

  const form = useForm<InsertStaffBook>({
    resolver: zodResolver(insertStaffBookSchema),
    defaultValues: {
      billbookRange: "",
      staffName: "",
    },
  });

  const createStaffBookMutation = useMutation({
    mutationFn: async (data: InsertStaffBook) => {
      const response = await apiRequest("POST", "/api/staff-book", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-book"] });
      toast({
        title: "Success",
        description: "Staff billbook entry added successfully!",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add staff billbook entry",
        variant: "destructive",
      });
    },
  });

  const deleteStaffBookMutation = useMutation({
    mutationFn: async (billbookRange: string) => {
      const response = await apiRequest("DELETE", `/api/staff-book/${encodeURIComponent(billbookRange)}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-book"] });
      toast({
        title: "Success",
        description: "Staff billbook entry removed successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove staff billbook entry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertStaffBook) => {
    // Validate billbook range format
    if (!/^\d+-\d+$/.test(data.billbookRange)) {
      toast({
        title: "Invalid Format",
        description: "Billbook range must be in 'start-end' format, e.g., 301-350.",
        variant: "destructive",
      });
      return;
    }

    createStaffBookMutation.mutate(data);
  };

  const handleRemove = (billbookRange: string) => {
    if (confirm(`Are you sure you want to remove the billbook assignment for ${billbookRange}?`)) {
      deleteStaffBookMutation.mutate(billbookRange);
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading staff assignments...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy-dark mb-6">Staff/Billbook Management</h2>
      
      {/* Add Staff Form */}
      <div className="form-section mb-6">
        <h3 className="text-lg font-semibold text-navy-light mb-4">Add Staff to Billbook</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-4 items-end">
              <FormField
                control={form.control}
                name="billbookRange"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-navy-light">Billbook Number Range</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. 301-350" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="staffName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-navy-light">Staff Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Staff Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="btn-action"
                disabled={createStaffBookMutation.isPending}
              >
                {createStaffBookMutation.isPending ? "Adding..." : "Add Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Staff Assignments List */}
      <div>
        <h3 className="text-lg font-semibold text-navy-light mb-4">Current Staff Assignments</h3>
        {staffBooks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No staff assignments found. Add some above.
          </div>
        ) : (
          <div className="space-y-3">
            {staffBooks.map((staffBook) => (
              <div key={staffBook.id} className="billbook-item">
                <Input
                  value={staffBook.billbookRange}
                  className="w-24 text-center"
                  readOnly
                />
                <span className="text-navy-dark font-medium flex-1">
                  assigned to <strong>{staffBook.staffName}</strong>
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemove(staffBook.billbookRange)}
                  disabled={deleteStaffBookMutation.isPending}
                  className="text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
