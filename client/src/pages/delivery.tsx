import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Order, type EntryStatus } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface DeliveryUpdateForm {
  sno: string;
  deliveryStatus: string;
}

export default function DeliveryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: entryStatuses = [] } = useQuery<EntryStatus[]>({
    queryKey: ["/api/entry-status"],
  });

  const searchForm = useForm<{ sno: string }>({
    defaultValues: {
      sno: "",
    },
  });

  const updateForm = useForm<DeliveryUpdateForm>({
    defaultValues: {
      sno: "",
      deliveryStatus: "",
    },
  });

  const updateDeliveryMutation = useMutation({
    mutationFn: async (data: { sno: string; deliveryStatus: string }) => {
      const response = await apiRequest("PUT", `/api/orders/${data.sno}`, {
        deliveryStatus: data.deliveryStatus,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: "Delivery status updated successfully!",
      });
      setSelectedOrder(null);
      searchForm.reset();
      updateForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery status",
        variant: "destructive",
      });
    },
  });

  const onSearchSubmit = (data: { sno: string }) => {
    const order = orders.find(o => o.sno === data.sno);
    if (!order) {
      toast({
        title: "Order Not Found",
        description: `Order with S No ${data.sno} not found.`,
        variant: "destructive",
      });
      setSelectedOrder(null);
      return;
    }
    
    setSelectedOrder(order);
    updateForm.setValue("sno", order.sno);
    updateForm.setValue("deliveryStatus", order.deliveryStatus);
  };

  const onUpdateSubmit = (data: DeliveryUpdateForm) => {
    updateDeliveryMutation.mutate(data);
  };

  const getEntryStatusDisplay = (sno: string) => {
    const statuses = entryStatuses.filter(es => es.sno === sno);
    return statuses.length > 0
      ? statuses.map(es => `${es.product} ${es.package ? "✅" : "❌"}`).join(" | ")
      : "None";
  };

  // Calculate delivery stats
  const deliveryStats = {
    delivered: orders.filter(o => o.deliveryStatus === "delivered").length,
    pending: orders.filter(o => o.deliveryStatus === "pending").length,
    canceled: orders.filter(o => o.deliveryStatus === "canceled").length,
  };

  // Get recent orders (last 10, sorted by creation date)
  const recentOrders = orders
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 10);

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy-dark mb-6">Delivery Management</h2>
      
      {/* Search Order Form */}
      <div className="form-section mb-6">
        <h3 className="text-lg font-semibold text-navy-light mb-4">Update Delivery Status</h3>
        <Form {...searchForm}>
          <form onSubmit={searchForm.handleSubmit(onSearchSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <FormField
                control={searchForm.control}
                name="sno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy-light">Enter S No to update</FormLabel>
                    <FormControl>
                      <Input {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="btn-action">
                Show Order Details
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Order Details & Update Form */}
      {selectedOrder && (
        <div className="details-section mb-6">
          <h3 className="text-xl font-bold text-navy-dark mb-4">Order Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            <p><strong className="text-navy-light">S No:</strong> {selectedOrder.sno}</p>
            <p><strong className="text-navy-light">Product:</strong> {selectedOrder.product}</p>
            <p><strong className="text-navy-light">Delivery Date:</strong> {selectedOrder.dDate}</p>
            <p><strong className="text-navy-light">Entry Statuses:</strong> {getEntryStatusDisplay(selectedOrder.sno)}</p>
          </div>
          
          <hr className="my-4" />
          
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="deliveryStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy-light font-bold">Update Delivery Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="max-w-xs">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="btn-action"
                disabled={updateDeliveryMutation.isPending}
              >
                {updateDeliveryMutation.isPending ? "Updating..." : "Update Status"}
              </Button>
            </form>
          </Form>
        </div>
      )}

      {/* Delivery Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h3 className="text-2xl font-bold text-green-800 mb-2">{deliveryStats.delivered}</h3>
          <p className="text-green-600 font-medium">Delivered Orders</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-2xl font-bold text-yellow-800 mb-2">{deliveryStats.pending}</h3>
          <p className="text-yellow-600 font-medium">Pending Orders</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-2xl font-bold text-red-800 mb-2">{deliveryStats.canceled}</h3>
          <p className="text-red-600 font-medium">Canceled Orders</p>
        </div>
      </div>

      {/* Recent Delivery Updates */}
      <div className="bg-bg-light p-6 rounded-lg border border-border-light shadow-md">
        <h3 className="text-lg font-semibold text-navy-light mb-4">Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No orders found.
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex justify-between items-center py-3 border-b border-border-light last:border-b-0">
                <div>
                  <span className="font-medium text-navy-dark">Order #{order.sno}</span>
                  <span className="text-gray-600 ml-2">{order.product}</span>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.deliveryStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.deliveryStatus === 'delivered' ? 'Delivered' :
                     order.deliveryStatus === 'pending' ? 'Pending' : 'Canceled'}
                  </span>
                  <div className="text-sm text-gray-500 mt-1">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
