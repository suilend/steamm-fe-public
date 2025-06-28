import { ChangeEvent, DragEvent, useEffect, useState } from "react";

import BigNumber from "bignumber.js";
import { parse as parseCsv } from "csv-parse/sync";
import { FileSpreadsheet, X } from "lucide-react";

import { Token, formatNumber } from "@suilend/sui-fe";
import { showErrorToast } from "@suilend/sui-fe-next";

import AirdropAddressAmountTable from "@/components/airdrop/AirdropAddressAmountTable";
import Parameter from "@/components/Parameter";
import { AirdropRow } from "@/lib/airdrop";
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
  token,
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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const reset = () => {
    setCsvRows(undefined);
    setCsvFilename("");
    setCsvFileSize("");
    (document.getElementById("csv-upload") as HTMLInputElement).value = "";
  };

  const handleFile = async (file: File) => {
    try {
      reset();
      setIsProcessing(true);

      // Validate file type
      if (!VALID_MIME_TYPES.includes(file.type))
        throw new Error("Please upload a CSV file");

      // Read file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          await sleep(250);
          const text = e.target?.result as string;

          const records: { [key: string]: string }[] = parseCsv(text, {
            columns: true,
            delimiter: ",",
            skip_empty_lines: true,
          });

          if (records.length === 0) throw new Error("No rows found");
          if (Object.keys(records[0]).length !== 2)
            throw new Error(
              "Each row must have exactly 2 columns (address, amount)",
            );

          const parsedRecords: AirdropRow[] = records.map((record, index) => {
            const addressKey = Object.keys(record)[0];
            const amountKey = Object.keys(record)[1];

            return {
              number: index + 1,
              address: record[addressKey],
              amount: record[amountKey],
            };
          });

          setCsvRows(parsedRecords);
          setIsProcessing(false);
          setCsvFilename(file.name);
          setCsvFileSize(
            file.size > 1024
              ? `${formatNumber(new BigNumber(file.size / 1024), { dp: 1 })} KB`
              : `${formatNumber(new BigNumber(file.size), { dp: 1 })} B`,
          );
        } catch (err) {
          console.error(err);
          showErrorToast("Failed to upload CSV file", err as Error);

          reset();
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        try {
          throw new Error("Failed to upload CSV file");
        } catch (err) {
          console.error(err);
          showErrorToast("Failed to upload CSV file", err as Error);

          reset();
          setIsProcessing(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error(err);
      showErrorToast("Failed to upload CSV file", err as Error);

      reset();
      setIsProcessing(false);
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

      <Parameter
        className="gap-3"
        labelContainerClassName="flex-col gap-1 items-start"
        label="CSV file"
        labelEndDecorator="Address & amount columns, comma-separated"
      >
        <div className="flex w-full flex-row items-center gap-4">
          {/* CSV */}
          <div className="group relative flex w-max flex-row items-center justify-center rounded-md border">
            {isProcessing || (csvRows ?? []).length > 0 ? (
              <>
                {!isProcessing && (csvRows ?? []).length > 0 && (
                  <button
                    className="absolute right-1 top-1 z-[2] rounded-md border bg-background p-1 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                    onClick={reset}
                  >
                    <X className="h-4 w-4 text-secondary-foreground transition-colors hover:text-foreground" />
                  </button>
                )}

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
              disabled={isProcessing}
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
      </Parameter>

      {token !== undefined && (isProcessing || csvRows !== undefined) && (
        <AirdropAddressAmountTable token={token} rows={csvRows} />
      )}
    </>
  );
}
