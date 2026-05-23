import { FC, useState } from "react";

interface FileInputProps {
  className?: string;
  accept?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileInput: FC<FileInputProps> = ({ className = "", accept, onChange }) => {
  const [fileName, setFileName] = useState<string>("No file chosen");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileName(file ? file.name : "No file chosen");
    onChange?.(event);
  };

  return (
    <div
      className={`flex h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      <label className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 cursor-pointer dark:bg-white/5 dark:text-gray-200">
        Choose file
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="absolute w-px h-px overflow-hidden border-0 p-0 m-0 -m-px whitespace-nowrap clip-[rect(0,0,0,0)]"
        />
      </label>
      <div className="flex items-center flex-1 px-3 text-xs text-gray-500 truncate dark:text-gray-400">
        {fileName}
      </div>
    </div>
  );
};

export default FileInput;
