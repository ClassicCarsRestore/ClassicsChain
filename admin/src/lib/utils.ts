import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ALGORAND_NETWORK = import.meta.env.VITE_ALGORAND_NETWORK || 'localnet'

export function getAlgorandAssetUrl(assetId: string): string {
  return `https://lora.algokit.io/${ALGORAND_NETWORK}/asset/${assetId}`
}

export function getAlgorandTxUrl(txId: string): string {
  return `https://lora.algokit.io/${ALGORAND_NETWORK}/transaction/${txId}`
}
