import type { ClientShellOverrides } from '@/lib/client-shell';
import { ParalocaHeader } from './paraloca/header';
import { ParalocaFooter } from './paraloca/footer';
import { ParalocaLanding } from './paraloca/landing';

/** ParaLoca storefront look. Lives only in this instance; the EcomOS starter ships no client shells. */
export const paralocaShell: ClientShellOverrides = {
  htmlLang: 'fr',
  Header: ParalocaHeader,
  Footer: ParalocaFooter,
  Landing: ParalocaLanding,
};
