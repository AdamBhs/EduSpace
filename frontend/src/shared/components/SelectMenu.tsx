import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type Props = {
  placeholder?: string;
  label: string;
  data: string[];
  autoSelect?: boolean;
};

export function SelectMenu({ placeholder, label, data, autoSelect }: Props) {
  return (
    <Select defaultValue={autoSelect ? data[0] : undefined}>
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        side="bottom"
        align="end"
        sideOffset={4}
        avoidCollisions={false}
      >
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {data.map((value: string, index: any) => (
            <SelectItem value={value} key={index}>
              {value}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
