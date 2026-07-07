// Realistic dummy data for demo/empty states.
export interface MockCampaign {
  id: string;
  name: string;
  status: "sent" | "scheduled" | "sending" | "draft" | "failed";
  contacts: number;
  sent: number;
  delivered: number;
  read: number;
  date: string;
  message: string;
}

export const mockCampaigns: MockCampaign[] = [
  { id: "1", name: "Black Friday Blast", status: "sent", contacts: 2400, sent: 2400, delivered: 2352, read: 1876, date: "2026-06-28", message: "🔥 Black Friday is here! 40% off everything this weekend only. Shop now: waba.link/bf26" },
  { id: "2", name: "Salon Weekly Reminder", status: "sent", contacts: 480, sent: 480, delivered: 475, read: 402, date: "2026-06-25", message: "Hi {name}! Just a reminder your appointment is tomorrow at 10am. Reply 1 to confirm." },
  { id: "3", name: "Sunday Service Invite", status: "scheduled", contacts: 1200, sent: 0, delivered: 0, read: 0, date: "2026-07-13", message: "Join us this Sunday at 9am for a special worship service. God bless you {name}!" },
  { id: "4", name: "Restaurant Menu Update", status: "sending", contacts: 850, sent: 612, delivered: 588, read: 341, date: "2026-07-07", message: "New menu drop! 🍔 Check out our July specials — braai platters starting at N$120." },
  { id: "5", name: "Clinic Follow-up", status: "sent", contacts: 320, sent: 320, delivered: 316, read: 289, date: "2026-06-20", message: "Hi {name}, this is a friendly reminder to book your follow-up visit." },
  { id: "6", name: "Church Bazaar", status: "draft", contacts: 0, sent: 0, delivered: 0, read: 0, date: "2026-07-05", message: "Save the date — annual church bazaar coming soon!" },
  { id: "7", name: "VIP Loyalty Reward", status: "failed", contacts: 150, sent: 0, delivered: 0, read: 0, date: "2026-06-30", message: "You're a VIP! Enjoy a special 20% loyalty discount." },
];

export const mockContacts = [
  { id: "c1", name: "Anna Nangolo", phone: "+264 81 234 5678", email: "anna@example.com", group_name: "VIP", status: "active", created_at: "2026-05-01" },
  { id: "c2", name: "Johannes Shikongo", phone: "+264 81 987 6543", email: "jshikongo@example.com", group_name: "Leads", status: "active", created_at: "2026-05-03" },
  { id: "c3", name: "Maria Amupolo", phone: "+264 85 111 2222", email: "maria@example.com", group_name: "Customers", status: "active", created_at: "2026-05-04" },
  { id: "c4", name: "Peter Iyambo", phone: "+264 81 333 4444", email: "peter@example.com", group_name: "Leads", status: "unsubscribed", created_at: "2026-05-07" },
  { id: "c5", name: "Selma Haindongo", phone: "+264 85 555 6666", email: "selma@example.com", group_name: "VIP", status: "active", created_at: "2026-05-09" },
  { id: "c6", name: "David Mbumba", phone: "+264 81 777 8888", email: "david@example.com", group_name: "Customers", status: "active", created_at: "2026-05-11" },
  { id: "c7", name: "Rebecca Ndinelao", phone: "+264 85 999 0000", email: "rebecca@example.com", group_name: "Customers", status: "active", created_at: "2026-05-14" },
  { id: "c8", name: "Titus Kavango", phone: "+264 81 222 3333", email: "titus@example.com", group_name: "Leads", status: "active", created_at: "2026-05-18" },
];

export const mockDailySends = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const base = 400 + Math.sin(i / 3) * 200 + i * 12;
  return { date: d.toISOString().slice(5, 10), sent: Math.round(base + Math.random() * 120) };
});

export const mockContactLists = [
  { id: "l1", name: "All customers", contact_count: 2840 },
  { id: "l2", name: "VIP tier", contact_count: 320 },
  { id: "l3", name: "New leads (July)", contact_count: 187 },
  { id: "l4", name: "Church members", contact_count: 1240 },
];