import { PasswordRecovery } from "@/components/PasswordRecovery";
import { SetupRequired } from "@/components/ui";
import { supabaseConfigured } from "@/lib/env";
export default function Page() { return supabaseConfigured() ? <PasswordRecovery /> : <SetupRequired />; }
