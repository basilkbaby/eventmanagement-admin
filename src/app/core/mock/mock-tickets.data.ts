import { 
  Ticket, 
  TicketStatus, 
  Order, 
  OrderStatus, 
  PaymentStatus,
  Coupon,
  DiscountType
} from '../models/ticket.interface';

export const MOCK_TICKETS: Ticket[] = [
  {
    id: '1',
    eventId: '1',
    eventName: 'Mohanlal Live London: Beyond the Screen',
    ticketNumber: 'ML2026-001',
    attendee: {
      id: '1',
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      phone: '+44 7911 123456'
    },
    ticketType: {
      id: '1',
      name: 'VVIP Meet & Greet',
      description: 'Ultimate experience with backstage access and meet & greet',
      price: 300,
      quantity: 100,
      sold: 75,
      isActive: true,
      salesStart: new Date('2024-01-01'),
      salesEnd: new Date('2026-06-20')
    },
    status: TicketStatus.ACTIVE,
    price: 300,
    originalPrice: 300,
    purchaseDate: new Date('2024-10-15'),
    orderId: 'ORD-001',
    order: {} as Order,
    checkoutAnswers: [
      {
        questionId: '1',
        question: 'Dietary requirements for Meet & Greet dinner',
        answer: 'Vegetarian'
      }
    ],
    transferable: true,
    transferHistory: []
  },
  {
    id: '2',
    eventId: '1',
    eventName: 'Mohanlal Live London: Beyond the Screen',
    ticketNumber: 'ML2026-002',
    attendee: {
      id: '2',
      name: 'Priya Sharma',
      email: 'priya@example.com'
    },
    ticketType: {
      id: '2',
      name: 'VIP',
      description: 'Premium seating with enhanced experience',
      price: 200,
      quantity: 500,
      sold: 350,
      isActive: true,
      salesStart: new Date('2024-01-01'),
      salesEnd: new Date('2026-06-20')
    },
    status: TicketStatus.USED,
    price: 200,
    originalPrice: 200,
    purchaseDate: new Date('2024-10-14'),
    scannedAt: new Date('2024-10-25'),
    scannedBy: 'Staff-001',
    orderId: 'ORD-001',
    order: {} as Order,
    checkoutAnswers: [],
    transferable: false,
    transferHistory: []
  },
  {
    id: '3',
    eventId: '2',
    eventName: 'AGAM - Live in Concert',
    ticketNumber: 'AG2025-001',
    attendee: {
      id: '3',
      name: 'Amit Patel',
      email: 'amit@example.com'
    },
    ticketType: {
      id: '3',
      name: 'VIP Meet & Greet',
      description: 'Premium seating with meet & greet the band',
      price: 75,
      quantity: 50,
      sold: 45,
      isActive: true,
      salesStart: new Date('2024-10-01'),
      salesEnd: new Date('2025-02-10')
    },
    status: TicketStatus.ACTIVE,
    price: 60,
    originalPrice: 75,
    purchaseDate: new Date('2024-10-20'),
    orderId: 'ORD-002',
    order: {} as Order,
    checkoutAnswers: [],
    couponApplied: {
      id: 'coupon-1',
      code: 'EARLYBIRD20',
      name: 'Early Bird Discount',
      description: '20% off for early registrations',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      usedCount: 25,
      validFrom: new Date('2024-10-01'),
      validUntil: new Date('2024-11-30'),
      isActive: true
    },
    transferable: true,
    transferHistory: []
  },
  {
    id: '4',
    eventId: '2',
    eventName: 'AGAM - Live in Concert',
    ticketNumber: 'AG2025-002',
    attendee: {
      id: '4',
      name: 'Sunita Reddy',
      email: 'sunita@example.com'
    },
    ticketType: {
      id: '4',
      name: 'Standard Admission',
      description: 'General admission standing',
      price: 35,
      quantity: 750,
      sold: 600,
      isActive: true,
      salesStart: new Date('2024-10-01'),
      salesEnd: new Date('2025-02-10')
    },
    status: TicketStatus.CANCELLED,
    price: 35,
    originalPrice: 35,
    purchaseDate: new Date('2024-10-18'),
    orderId: 'ORD-003',
    order: {} as Order,
    checkoutAnswers: [],
    transferable: true,
    transferHistory: []
  },
  {
    id: '5',
    eventId: '3',
    eventName: 'AGAM - UK Tour: Birmingham',
    ticketNumber: 'AG2025-BIR-001',
    attendee: {
      id: '5',
      name: 'David Wilson',
      email: 'david@example.com',
      phone: '+44 7911 654321'
    },
    ticketType: {
      id: '5',
      name: 'VIP Experience',
      description: 'Premium package with exclusive benefits',
      price: 65,
      quantity: 30,
      sold: 25,
      isActive: true,
      salesStart: new Date('2024-10-05'),
      salesEnd: new Date('2025-02-15')
    },
    status: TicketStatus.ACTIVE,
    price: 65,
    originalPrice: 65,
    purchaseDate: new Date('2024-10-22'),
    orderId: 'ORD-004',
    order: {} as Order,
    checkoutAnswers: [
      {
        questionId: '1',
        question: 'Which AGAM song are you most excited to hear?',
        answer: 'Malhar Jam'
      }
    ],
    transferable: true,
    transferHistory: []
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    orderNumber: 'ORD-001',
    userId: 'user-1',
    userName: 'Rajesh Kumar',
    userEmail: 'rajesh@example.com',
    eventId: '1',
    eventName: 'Mohanlal Live London: Beyond the Screen',
    tickets: [], // Will be populated
    totalAmount: 500,
    discountAmount: 0,
    finalAmount: 500,
    currency: 'GBP',
    status: OrderStatus.CONFIRMED,
    paymentMethod: 'credit_card',
    paymentStatus: PaymentStatus.COMPLETED,
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-10-15')
  },
  {
    id: 'ORD-002',
    orderNumber: 'ORD-002',
    userId: 'user-3',
    userName: 'Amit Patel',
    userEmail: 'amit@example.com',
    eventId: '2',
    eventName: 'AGAM - Live in Concert',
    tickets: [], // Will be populated
    totalAmount: 60,
    discountAmount: 15,
    finalAmount: 60,
    currency: 'GBP',
    status: OrderStatus.CONFIRMED,
    paymentMethod: 'paypal',
    paymentStatus: PaymentStatus.COMPLETED,
    createdAt: new Date('2024-10-20'),
    updatedAt: new Date('2024-10-20'),
    couponCode: 'EARLYBIRD20'
  },
  {
    id: 'ORD-003',
    orderNumber: 'ORD-003',
    userId: 'user-4',
    userName: 'Sunita Reddy',
    userEmail: 'sunita@example.com',
    eventId: '2',
    eventName: 'AGAM - Live in Concert',
    tickets: [], // Will be populated
    totalAmount: 35,
    discountAmount: 0,
    finalAmount: 35,
    currency: 'GBP',
    status: OrderStatus.CANCELLED,
    paymentMethod: 'credit_card',
    paymentStatus: PaymentStatus.REFUNDED,
    createdAt: new Date('2024-10-18'),
    updatedAt: new Date('2024-10-19')
  },
  {
    id: 'ORD-004',
    orderNumber: 'ORD-004',
    userId: 'user-5',
    userName: 'David Wilson',
    userEmail: 'david@example.com',
    eventId: '3',
    eventName: 'AGAM - UK Tour: Birmingham',
    tickets: [], // Will be populated
    totalAmount: 65,
    discountAmount: 0,
    finalAmount: 65,
    currency: 'GBP',
    status: OrderStatus.CONFIRMED,
    paymentMethod: 'credit_card',
    paymentStatus: PaymentStatus.COMPLETED,
    createdAt: new Date('2024-10-22'),
    updatedAt: new Date('2024-10-22')
  }
];

export const MOCK_EVENTS = [
  { id: '1', name: 'Mohanlal Live London: Beyond the Screen' },
  { id: '2', name: 'AGAM - Live in Concert' },
  { id: '3', name: 'AGAM - UK Tour: Birmingham' }
];