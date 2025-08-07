import { Order, EntryStatus } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface OrderTableProps {
  orders: Order[];
  entryStatuses: EntryStatus[];
  onShowDetails: (order: Order) => void;
  onEditOrder: (order: Order) => void;
}

export function OrderTable({ orders, entryStatuses, onShowDetails, onEditOrder }: OrderTableProps) {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "delivered":
        return "Delivered ✅";
      case "pending":
        return "Pending ⏳";
      case "canceled":
        return "Canceled ❌";
      default:
        return "N/A";
    }
  };

  const getRowClass = (status: string) => {
    switch (status) {
      case "delivered":
        return "order-delivered";
      case "pending":
        return "order-pending";
      case "canceled":
        return "order-canceled";
      default:
        return "";
    }
  };

  const getEntryStatusDisplay = (sno: string) => {
    const statuses = entryStatuses.filter(es => es.sno === sno);
    return statuses.length > 0
      ? statuses.map(es => `${es.product} ${es.package ? "✅" : "❌"}`).join(" | ")
      : "None";
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No orders found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-bg-light rounded-lg shadow-md">
      <table className="orders-table">
        <thead>
          <tr className="bg-navy-light text-white">
            <th className="border border-shadow-color px-4 py-3 text-center font-semibold">S No</th>
            <th className="border border-shadow-color px-4 py-3 text-center font-semibold">Delivery Date</th>
            <th className="border border-shadow-color px-4 py-3 text-center font-semibold">Product</th>
            <th className="border border-shadow-color px-4 py-3 text-center font-semibold">Staff</th>
            <th className="border border-shadow-color px-4 py-3 text-center font-semibold">Entry Statuses</th>
            <th className="border border-shadow-color px-4 py-3 text-center font-semibold">Delivery Status</th>
            <th className="border border-shadow-color px-4 py-3 text-center font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className={`${getRowClass(order.deliveryStatus)} hover:bg-gray-50 cursor-pointer transition-colors duration-200`}
              onClick={() => onShowDetails(order)}
            >
              <td className="border border-shadow-color px-4 py-3 text-center">{order.sno}</td>
              <td className="border border-shadow-color px-4 py-3 text-center">{order.dDate || 'N/A'}</td>
              <td className="border border-shadow-color px-4 py-3 text-center">{order.product}</td>
              <td className="border border-shadow-color px-4 py-3 text-center">{order.staffName || ""}</td>
              <td className="border border-shadow-color px-4 py-3 text-center">{getEntryStatusDisplay(order.sno)}</td>
              <td className="border border-shadow-color px-4 py-3 text-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.deliveryStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {getStatusLabel(order.deliveryStatus)}
                </span>
              </td>
              <td className="border border-shadow-color px-4 py-3 text-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="small-btn mr-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDetails(order);
                  }}
                >
                  Details
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="small-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditOrder(order);
                  }}
                >
                  Edit
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
