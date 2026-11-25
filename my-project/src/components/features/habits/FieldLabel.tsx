import { icon } from "@/ui/icons";
import { Icon } from "@/ui/components/Icon";

/** The habit flow's field label as designed: a leaf, the label, and «— اختياري» when optional. */
export function FieldLabel({
  as = "span",
  text,
  optional,
  htmlFor,
  id,
  plain = false,
}: {
  as?: "span" | "legend" | "label" | "h2";
  text: string;
  optional?: string;
  htmlFor?: string;
  id?: string;
  /** Without the leaf, in ink (the design's «أيام التكرار» and «الخصوصيّة»). */
  plain?: boolean;
}) {
  const className = `field-lbl ${plain ? "is-plain" : ""}`;
  const content = (
    <>
      {!plain && <Icon src={icon("eco")} />}
      <span>
        {text}
        {optional && (
          <>
            {" — "}
            <span className="opt">{optional}</span>
          </>
        )}
      </span>
    </>
  );
  if (as === "label")
    return (
      <label className={className} htmlFor={htmlFor} id={id}>
        {content}
      </label>
    );
  const Tag = as;
  return (
    <Tag className={className} id={id}>
      {content}
    </Tag>
  );
}
