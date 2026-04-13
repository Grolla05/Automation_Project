import { create } from 'zustand';

interface UpdateState {
  hasCheckedForUpdate: boolean;
  setHasCheckedForUpdate: (checked: boolean) => void;
}

export const useUpdateStore = create<UpdateState>((set) => ({
  hasCheckedForUpdate: false,
  setHasCheckedForUpdate: (checked) => set({ hasCheckedForUpdate: checked }),
}));
