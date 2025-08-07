import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { insertOrderSchema, type InsertOrder } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function OrdersPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if editing an existing order
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const editSno = urlParams.get('edit');

  const { data: existingOrder } = useQuery({
    queryKey: ["/api/orders", editSno],
    enabled: !!editSno,
  });

  const form = useForm<InsertOrder>({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: {
      sno: "",
      product: "",
      additional: "",
      oDate: "",
      dDate: "",
      tel: "",
      link: "",
      deliveryStatus: "pending",
      staffName: "",
    },
  });

  // Reset form with existing order data when editing
  useEffect(() => {
    if (existingOrder && existingOrder.sno) {
      form.reset({
        sno: existingOrder.sno,
        product: existingOrder.product,
        additional: existingOrder.additional || "",
        oDate: existingOrder.oDate,
        dDate: existingOrder.dDate,
        tel: existingOrder.tel,
        link: existingOrder.link || "",
        deliveryStatus: existingOrder.deliveryStatus,
        staffName: existingOrder.staffName || "",
      });
    }
  }, [existingOrder, form]);

  const createOrderMutation = useMutation({
    mutationFn: async (data: InsertOrder) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: "Order saved successfully!",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save order",
        variant: "destructive",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: InsertOrder) => {
      const response = await apiRequest("PUT", `/api/orders/${editSno}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", editSno] });
      toast({
        title: "Success",
        description: "Order updated successfully!",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertOrder) => {
    if (editSno) {
      updateOrderMutation.mutate(data);
    } else {
      createOrderMutation.mutate(data);
    }
  };

  const isLoading = createOrderMutation.isPending || updateOrderMutation.isPending;

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy-dark mb-6">
        {editSno ? "Update Order" : "Add Order"}
      </h2>
      
      <div className="form-section">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="sno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy-light">S No</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" required />
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
                    <FormControl>
                      <Input {...field} placeholder="Type product name" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy-light">Additional</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="oDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy-light">Order Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy-light">Delivery Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy-light">Telephone</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy-light">Image Link</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy-light">Delivery Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="btn-action"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : editSno ? "Update Order" : "Save Order"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
