import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertEntryStatusSchema, type InsertEntryStatus, type EntryStatus } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const productOptions = [
  "sherwani",
  "indo western",
  "jodhpuri",
  "coat pant",
];

export default function EntryStatusPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entryStatuses = [], isLoading } = useQuery<EntryStatus[]>({
    queryKey: ["/api/entry-status"],
  });

  const form = useForm<InsertEntryStatus>({
    resolver: zodResolver(insertEntryStatusSchema),
    defaultValues: {
      sno: "",
      product: "",
      package: false,
    },
  });

  const createEntryStatusMutation = useMutation({
    mutationFn: async (data: InsertEntryStatus) => {
      const response = await apiRequest("POST", "/api/entry-status", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/entry-status"] });
      toast({
        title: "Success",
        description: "Entry status added successfully!",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add entry status",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEntryStatus) => {
    createEntryStatusMutation.mutate(data);
  };

  // Group entry statuses by S No
  const groupedStatuses = entryStatuses.reduce((acc, status) => {
    if (!acc[status.sno]) {
      acc[status.sno] = [];
    }
    acc[status.sno].push(status);
    return acc;
  }, {} as Record<string, EntryStatus[]>);

  if (isLoading) {
    return <div className="text-center">Loading entry statuses...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy-dark mb-6">Entry Status Tracking</h2>
      
      {/* Add Entry Status Form */}
      <div className="form-section mb-6">
        <h3 className="text-lg font-semibold text-navy-light mb-4">Add Entry Status</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <FormField
                control={form.control}
                name="sno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy-light">Order S No</FormLabel>
                    <FormControl>
                      <Input {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy-light">Product</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productOptions.map((product) => (
                          <SelectItem key={product} value={product}>
                            {product.charAt(0).toUpperCase() + product.slice(1)}
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
                name="package"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy-light">Package Status</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value?.toString() || "false"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Complete ✅</SelectItem>
                        <SelectItem value="false">Incomplete ❌</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="btn-action"
                disabled={createEntryStatusMutation.isPending}
              >
                {createEntryStatusMutation.isPending ? "Adding..." : "Add Status"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Entry Status Table */}
      <div className="overflow-x-auto bg-bg-light rounded-lg shadow-md">
        <table className="orders-table">
          <thead>
            <tr className="bg-navy-light text-white">
              <th className="border border-shadow-color px-4 py-3 text-center font-semibold">S No</th>
              <th className="border border-shadow-color px-4 py-3 text-center font-semibold">Product Statuses</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(groupedStatuses).length === 0 ? (
              <tr>
                <td colSpan={2} className="border border-shadow-color px-4 py-8 text-center text-gray-500">
                  No entry statuses found.
                </td>
              </tr>
            ) : (
              Object.entries(groupedStatuses).map(([sno, statuses]) => (
                <tr key={sno} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border border-shadow-color px-4 py-3 text-center">{sno}</td>
                  <td className="border border-shadow-color px-4 py-3 text-center">
                    {statuses.map((status, index) => (
                      <span key={index} className="inline-block mr-2">
                        <span className="font-medium">{status.product}</span>{" "}
                        <span className={status.package ? "text-green-600" : "text-red-600"}>
                          {status.package ? "✅" : "❌"}
                        </span>
                        {index < statuses.length - 1 && " | "}
                      </span>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
