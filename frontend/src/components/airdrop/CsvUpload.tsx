import { ChangeEvent, DragEvent, useEffect, useState } from "react";

import { Download, FileSpreadsheet, X } from "lucide-react";

import { Token } from "@suilend/sui-fe";
import { showErrorToast } from "@suilend/sui-fe-next";

import TextInput from "@/components/TextInput";
import { AirdropRow, parseCsvText } from "@/lib/airdrop";
import { formatFileSize } from "@/lib/format";
import { sleep } from "@/lib/utils";

const VALID_MIME_TYPES = ["text/csv"];

interface CsvUploadProps {
  isDragAndDropDisabled?: boolean;
  token?: Token;
  csvRows: AirdropRow[] | undefined;
  setCsvRows: (rows: AirdropRow[] | undefined) => void;
  csvFilename: string;
  setCsvFilename: (filename: string) => void;
  csvFileSize: string;
  setCsvFileSize: (fileSize: string) => void;
}

export default function CsvUpload({
  isDragAndDropDisabled,
  csvRows,
  setCsvRows,
  csvFilename,
  setCsvFilename,
  csvFileSize,
  setCsvFileSize,
}: CsvUploadProps) {
  // Handle drag and drop
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleGlobalDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (
        e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        setIsDragging(false);
      }
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    document.addEventListener("dragover", handleGlobalDragOver as any);
    document.addEventListener("dragleave", handleGlobalDragLeave as any);
    document.addEventListener("drop", handleGlobalDrop as any);

    return () => {
      document.removeEventListener("dragover", handleGlobalDragOver as any);
      document.removeEventListener("dragleave", handleGlobalDragLeave as any);
      document.removeEventListener("drop", handleGlobalDrop as any);
    };
  }, []);

  // Process file
  const reset = () => {
    setCsvRows(undefined);
    setCsvFilename("");
    setCsvFileSize("");
    (document.getElementById("csv-upload") as HTMLInputElement).value = "";
  };

  // Paste CSV text
  const [pasteText, setPasteText] = useState<string>("");

  const handlePasteText = () => {
    if (!pasteText.trim()) return;
    try {
      reset();

      const parsedRecords = parseCsvText(pasteText);
      setCsvRows(parsedRecords);
      setCsvFilename("Pasted CSV");
      setCsvFileSize(formatFileSize(new Blob([pasteText]).size));

      setPasteText("");
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to parse CSV text", err as Error);

      reset();
    }
  };

  const handleFile = async (file: File) => {
    try {
      reset();
      setPasteText("");

      // Validate file type
      if (!VALID_MIME_TYPES.includes(file.type))
        throw new Error("Please upload a CSV file");

      // Read file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          await sleep(100);
          const text = e.target?.result as string;
          const parsedRecords = parseCsvText(text);
          setCsvRows(parsedRecords);
          setCsvFilename(file.name);
          setCsvFileSize(formatFileSize(file.size));
        } catch (err) {
          console.error(err);
          showErrorToast("Failed to upload CSV file", err as Error);

          reset();
        }
      };
      reader.onerror = () => {
        try {
          throw new Error("Failed to upload CSV file");
        } catch (err) {
          console.error(err);
          showErrorToast("Failed to upload CSV file", err as Error);

          reset();
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to upload CSV file", err as Error);

      reset();
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      reset();
      return;
    }

    await handleFile(file);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) {
      reset();
      return;
    }

    await handleFile(file);
  };

  return (
    <>
      {!isDragAndDropDisabled && isDragging && (
        <div
          className="fixed inset-0 z-50 flex flex-row items-center justify-center bg-background/80"
          onDrop={handleDrop}
        >
          <p className="text-p2 text-foreground">Drop to upload CSV</p>
        </div>
      )}

      <div className="flex w-full flex-col gap-2">
        <div className="flex w-full flex-row items-center gap-4">
          {/* CSV */}
          <div className="group relative flex w-max flex-row items-center justify-center rounded-md border">
            {(csvRows ?? []).length > 0 ? (
              <>
                <button
                  className="absolute right-1 top-1 z-[2] rounded-md border bg-background p-1 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                  onClick={reset}
                >
                  <X className="h-4 w-4 text-secondary-foreground transition-colors hover:text-foreground" />
                </button>

                <div className="pointer-events-none relative z-[1] flex h-24 w-24">
                  <FileSpreadsheet className="absolute left-4 top-4 h-16 w-16 text-button-1" />
                </div>
              </>
            ) : (
              <div className="pointer-events-none relative z-[2] flex h-24 w-24 flex-col items-center justify-center gap-0.5">
                <p className="text-p3 text-secondary-foreground">Drag & drop</p>
                <p className="text-p3 text-secondary-foreground">or browse</p>
              </div>
            )}

            <input
              id="csv-upload"
              className="absolute inset-0 z-[1] appearance-none opacity-0"
              type="file"
              accept={VALID_MIME_TYPES.join(",")}
              onChange={handleFileSelect}
              autoComplete="off"
            />
          </div>

          {/* Metadata */}
          <div className="flex flex-1 flex-col gap-1">
            <p className="break-all text-p2 text-secondary-foreground">
              {csvFilename || "--"}
            </p>
            <p className="text-p3 text-tertiary-foreground">
              {csvFileSize || "--"}
            </p>
          </div>
        </div>

        <button
          className="group flex w-24 flex-row items-center justify-center gap-1"
          onClick={() => window.open("/template.csv", "_blank")}
        >
          <Download className="h-3 w-3 text-secondary-foreground transition-colors group-hover:text-foreground" />
          <p className="text-p3 text-secondary-foreground transition-colors group-hover:text-foreground">
            Template
          </p>
        </button>
      </div>

      <div className="flex w-full flex-col gap-3">
        <p className="text-p2 text-secondary-foreground">Or paste CSV text</p>
        <TextInput
          placeholder={"address,amount\n0x1111...,50\n0x2222...,60.012345"}
          value={pasteText}
          onChange={setPasteText}
          isTextarea
          minRows={3}
        />

        <button
          className="flex h-8 w-max items-center justify-center rounded-md bg-button-1 px-4 text-p2 text-button-1-foreground transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
          disabled={!pasteText.trim()}
          onClick={handlePasteText}
        >
          Parse
        </button>
      </div>
    </>
  );
}
