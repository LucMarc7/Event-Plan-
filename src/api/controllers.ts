// src/api/controllers.ts
// ⚠️ ORGANISATEUR uniquement — ne pas confondre avec src/api/controles.ts (contrôleur)

import api from "./client";
import { ENDPOINTS } from "./endpoints";

export interface EventController {
  id: number;
  user_id: number;
  username: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface ControllersListResponse {
  event_id: string;
  event_name: string;
  event_code: string;
  max_controllers: number;
  current_count: number;
  controllers: EventController[];
}

export interface CreateControllerResponse {
  success: boolean;
  message: string;
  controller: {
    id: number;
    user_id: number;
    username: string;
    temp_password: string;
    name: string;
  };
  event: {
    id: string;
    name: string;
    event_code: string;
  };
}

export interface ControllerReportSummaryItem {
  user_id: number;
  username: string;
  name: string;
  is_active: boolean;
  created_at: string;
  validations: {
    invitations: number;
    tickets: number;
    total: number;
  };
  first_validation_at: string | null;
  last_validation_at: string | null;
  by_day: { date: string; count: number }[];
}

export interface ControllersReportResponse {
  event: {
    id: string;
    name: string;
    event_code: string;
    date: string | null;
    max_controllers: number;
  };
  summary: {
    total_controllers: number;
    active_controllers: number;
    total_invitation_validations: number;
    total_ticket_validations: number;
    total_validations: number;
  };
  controllers: ControllerReportSummaryItem[];
}

export interface ControllerHistoryEntry {
  type: "invitation" | "ticket";
  log_id: number;
  guest_name?: string | null;
  second_person?: string | null;
  place?: string | null;
  invitation_type?: string | null;
  ticket_code?: string | null;
  buyer_name?: string | null;
  category_name?: string | null;
  validated_at: string;
  ip_address: string | null;
  method?: string;
  device: {
    platform: string;
    label: string;
  };
}

export interface ControllerReportResponse {
  event: {
    id: string;
    name: string;
    event_code: string;
    date: string | null;
  };
  controller: {
    user_id: number;
    username: string;
    name: string;
    is_active: boolean;
    created_at: string;
  };
  stats: {
    total_scans: number;
    invitations_scanned: number;
    tickets_scanned: number;
    unique_ips: string[];
    first_scan_at: string | null;
    last_scan_at: string | null;
  };
  by_day: { date: string; count: number }[];
  history: ControllerHistoryEntry[];
}

export const listControllers = async (
  eventId: string,
): Promise<ControllersListResponse> => {
  const response = await api.get(ENDPOINTS.events.controllersList(eventId));
  return response.data;
};

export const createController = async (
  eventId: string,
  name: string,
): Promise<CreateControllerResponse> => {
  const response = await api.post(ENDPOINTS.events.controllersCreate(eventId), {
    name,
  });
  return response.data;
};

export const deactivateController = async (eventId: string, userId: number) => {
  const response = await api.delete(
    ENDPOINTS.events.controllerDetail(eventId, userId),
  );
  return response.data;
};

export const getControllersReport = async (
  eventId: string,
): Promise<ControllersReportResponse> => {
  const response = await api.get(ENDPOINTS.events.controllersReport(eventId));
  return response.data;
};

export const getControllerReport = async (
  eventId: string,
  userId: number,
): Promise<ControllerReportResponse> => {
  const response = await api.get(
    ENDPOINTS.events.controllerReport(eventId, userId),
  );
  return response.data;
};

export interface UpdateMaxControllersResponse {
  success: boolean;
  message: string;
  max_controllers: number;
}

export const updateMaxControllers = async (
  eventId: string,
  max: number,
): Promise<UpdateMaxControllersResponse> => {
  const response = await api.patch(ENDPOINTS.events.controllersMax(eventId), {
    max_controllers: max,
  });
  return response.data;
};
