export interface AddonContext {
  engineType: string;
  locale?: string;
}

export interface EcomAddon {
  register: (ctx: AddonContext) => void;
  disable: () => void;
}
