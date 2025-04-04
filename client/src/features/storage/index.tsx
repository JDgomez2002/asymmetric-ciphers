import { KeySettings } from "@/features/storage/components/key-settings";
import { FileList } from "@/features/storage/components/file-list";

export default function Storage() {
  return (
    <main className="flex flex-col container mx-auto px-4 py-6 max-w-4xl gap-6">
      <KeySettings />
      <FileList />
    </main>
  );
}
