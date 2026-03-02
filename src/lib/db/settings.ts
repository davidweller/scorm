import { promises as fs } from "fs";
import path from "path";
import { encrypt, decrypt } from "@/lib/crypto";

const DATA_DIR = path.join(process.cwd(), ".data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

interface SettingsRecord {
  openaiKeyEncrypted?: string;
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readSettings(): Promise<SettingsRecord> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
}

async function writeSettings(settings: SettingsRecord) {
  await ensureDataDir();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

export async function hasOpenAIKey(): Promise<boolean> {
  const s = await readSettings();
  return !!s.openaiKeyEncrypted;
}

export async function getOpenAIKey(): Promise<string | null> {
  const s = await readSettings();
  if (!s.openaiKeyEncrypted) return null;
  try {
    return decrypt(s.openaiKeyEncrypted);
  } catch {
    return null;
  }
}

export async function setOpenAIKey(key: string | null): Promise<void> {
  const s = await readSettings();
  if (key === null || key.trim() === "") {
    delete s.openaiKeyEncrypted;
  } else {
    s.openaiKeyEncrypted = encrypt(key.trim());
  }
  await writeSettings(s);
}
