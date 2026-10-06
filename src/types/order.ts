export interface Modifier {
  name: string;
  qty: number;
  modifiers?: Modifier[];
}

export interface Item {
  name: string;
  qty: number;
  modifiers?: Modifier[];
}

export interface Brand {
  brandId: number;
  posOrderNo: number;
  items: Item[];
}

export interface Order {
  orderId: number;
  orderNo: number;
  storeId: number;
  plazaId: number;
  pickupLocationId: number;
  pickupTime: string;
  guestName: string;
  displayStatus: "IN_PROGRESS" | "READY" | "COLLECTED" | string;
  brands: Brand[];
}

export interface ActiveOrdersResponse {
  storeId: number;
  orders: Order[];
}
