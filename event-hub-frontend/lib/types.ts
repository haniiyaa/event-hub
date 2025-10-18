export type ClubStatus = "PENDING" | "ACTIVE" | "RETIRED";
export type ClubJoinRequestType = "CREATE_CLUB" | "JOIN_CLUB";
export type ClubJoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type ClubMembershipRole = "MEMBER" | "OFFICER";

export type ChatScope = "CLUB" | "EVENT";

export interface ApiErrorPayload {
  status: number;
  error: string;
  message?: string;
  path?: string;
  details?: string[];
}

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: "STUDENT" | "CLUB_ADMIN" | "ADMIN";
  phoneNumber?: string | null;
  classDetails?: string | null;
  createdAt?: string | null;
}

export interface ClubMembershipSummary {
  id: number;
  role: ClubMembershipRole;
  joinedAt: string;
  club: {
    id: number;
    name: string;
    description?: string | null;
    status?: ClubStatus;
  } | null;
  member?: {
    id: number;
    username: string;
    fullName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    classDetails?: string | null;
  } | null;
}

export interface ClubBrowseSummary {
  id: number;
  name: string;
  description?: string | null;
  status: ClubStatus;
  member: boolean;
  membershipRole?: ClubMembershipRole | null;
  pendingRequest: boolean;
}

export interface ChatAuthorSummary {
  id: number;
  username: string;
  fullName?: string | null;
}

export interface ChatMessageSummary {
  id: number;
  content: string;
  createdAt: string;
  author: ChatAuthorSummary;
}

export interface ChatThreadPayload {
  threadId: number | null;
  scope: ChatScope | null;
  canPost: boolean;
  lastMessageId: number | null;
  messages: ChatMessageSummary[];
}

export interface AdminClub {
  id: number;
  name: string;
  description?: string | null;
  status: ClubStatus;
  createdAt?: string | null;
  admin?: {
    id: number;
    username: string;
    fullName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    classDetails?: string | null;
  } | null;
}

export interface EventSummary {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  capacity: number;
  currentRegistrations: number | null;
  club?: {
    id: number;
    name: string;
    status?: ClubStatus;
  };
}

export interface EventDetail extends EventSummary {
  createdAt?: string;
  instructions?: InstructionSummary[];
}

export interface InstructionSummary {
  id: number;
  title: string;
  content: string;
  isImportant: boolean;
  createdAt?: string;
}

export interface RegistrationSummary {
  registrationId: number;
  status: string;
  registeredAt: string;
  event: Pick<EventSummary, "id" | "title" | "eventDate" | "location" | "capacity" | "currentRegistrations">;
}

export interface StudentDashboardResponse {
  user: UserSummary;
  metrics: {
    totalRegistrations: number;
    upcomingRegistrations: number;
    pendingInstructions: number;
  };
  upcomingRegistrations: StudentDashboardRegistration[];
  recommendedEvents: EventSummary[];
  recentInstructions: StudentDashboardInstruction[];
}

export interface StudentDashboardRegistration {
  registrationId: number;
  status: string;
  registeredAt: string | null;
  event: EventSummary;
}

export interface StudentDashboardInstruction {
  instructionId: number;
  title: string;
  content: string;
  important?: boolean | null;
  createdAt?: string | null;
  event?: {
    id: number;
    title: string;
    eventDate?: string | null;
  } | null;
}

export interface ClubAdminDashboardResponse {
  hasClub: boolean;
  message?: string;
  club?: {
    id: number;
    name: string;
    description?: string;
    createdAt?: string;
    status?: ClubStatus;
  };
  metrics?: {
    totalEvents: number;
    upcomingEvents: number;
    totalRegistrations: number;
    instructionCount: number;
  };
  upcomingEvents: EventSummary[];
  recentRegistrations: ClubAdminRegistration[];
}

export interface ClubAdminRegistration {
  registrationId: number;
  status: string;
  registeredAt: string | null;
  event: EventSummary;
  attendee?: {
    id: number;
    username: string;
    fullName?: string | null;
    email: string;
    phoneNumber?: string | null;
    classDetails?: string | null;
  } | null;
}

export interface ClubJoinRequestSummary {
  id: number;
  type: ClubJoinRequestType;
  status: ClubJoinRequestStatus;
  message?: string | null;
  requestedName?: string | null;
  requestedDescription?: string | null;
  createdAt?: string | null;
  reviewedAt?: string | null;
  requester?: {
    id: number;
    username: string;
    fullName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    classDetails?: string | null;
  } | null;
  reviewer?: {
    id: number;
    username: string;
    fullName?: string | null;
    email?: string | null;
  } | null;
  club?: {
    id: number;
    name: string;
  } | null;
}
