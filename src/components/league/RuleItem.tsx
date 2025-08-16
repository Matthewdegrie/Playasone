'use client';

type Props = {
  index?: number;
  text: string;
};

export default function RuleItem({ index, text }: Props) {
  return (
    <li className="flex items-start gap-3 rounded-md border p-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
        {index ?? '•'}
      </span>
      <p className="text-sm leading-relaxed">{text}</p>
    </li>
  );
}