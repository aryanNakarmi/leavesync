export interface User {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: "EMPLOYEE" | "ADMIN";
  departmentId?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface LeaveType {
  _id?: string;
  name: string;
  isPaid: boolean;
  annualQuota: number;
  accrualMethod: "ANNUAL" | "MONTHLY" | "QUARTERLY" | "EVENT_BASED";
  maxCarryover: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface LeaveRequest {
  _id?: string;
  userId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminComment?: string;
  createdAt: Date;
}

export interface LeaveBalance {
  _id?: string;
  userId: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  used: number;
  carriedOver: number;
}

export interface Department {
  _id?: string;
  name: string;
  createdAt: Date;
}
