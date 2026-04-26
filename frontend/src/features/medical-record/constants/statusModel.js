import { AlertTriangle, Check, ShieldCheck } from "lucide-react";

export const FIELD_STATUS = {
  EMPTY: "empty",
  PENDING: "pending",
  APPROVED: "approved",
  AUTO_APPROVED: "automatically_approved",
  EDITED: "edited",
};

export function getStatusMeta(status) {
  if (status === FIELD_STATUS.APPROVED) {
    return {
      Icon: ShieldCheck,
      text: "Approved",
      title: "You have manually confirmed this information",
      className: "hv-field-status-text hv-field-status-text--approved",
    };
  }
  if (status === FIELD_STATUS.AUTO_APPROVED) {
    return {
      Icon: ShieldCheck,
      text: "Approved",
      title: "We're confident this information is correct, but you can always edit it. We could make mistakes",
      className: "hv-field-status-text hv-field-status-text--auto",
    };
  }
  if (status === FIELD_STATUS.EDITED) {
    return {
      Icon: Check,
      text: "Edited",
      title: "This field was manually edited and may still require final review",
      className: "hv-field-status-text hv-field-status-text--edited",
    };
  }
  return {
    Icon: AlertTriangle,
    text: "Needs review",
    title: "We have extracted some information from the document but you must review it cause it can contain not related information",
    className: "hv-field-status-text hv-field-status-text--pending",
  };
}
