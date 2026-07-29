export interface OnboardingActionProps {
  actionLabel?: string;
  onActionPress?: () => void;
  actionDisabled?: boolean;
  actionBusy?: boolean;
}
