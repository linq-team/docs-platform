import * as React from 'react';
import style from '../style';
import { InputProps } from './primitives';

const getMaskedParts = (text: string): { prefix: string; maskedSecret: string } => {
  if (!text) return { prefix: '', maskedSecret: '' };

  const percentLength = Math.min(Math.floor(text.length * 0.3), 8);
  const firstChunk = text.substring(0, percentLength);
  const nonAlphaMatches = [...firstChunk.matchAll(/[^a-zA-Z0-9]/g)];

  let prefixEnd: number;
  if (nonAlphaMatches.length > 0) {
    const lastMatch = nonAlphaMatches.at(-1)!;

    prefixEnd = lastMatch.index + 1;
  } else {
    prefixEnd = percentLength;
  }

  return {
    prefix: text.substring(0, prefixEnd),
    maskedSecret: '•'.repeat(text.length - prefixEnd),
  };
};

export const MaskedInput = function Input({ left, right, defaultValue, value, ref, ...props }: InputProps) {
  const initialValue = (value ?? defaultValue ?? '').toString();
  const [displayValue, setDisplayValue] = React.useState(initialValue);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(ref, () => inputRef.current);

  const updateDisplayValue = () => {
    if (inputRef.current) {
      setDisplayValue(inputRef.current.value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    updateDisplayValue();
    inputRef.current?.scrollTo({
      behavior: 'instant',
      left: 0,
      top: 0,
    });
    props.onBlur?.(e);
  };

  const { prefix, maskedSecret } = getMaskedParts(displayValue);

  return (
    <div className={style.Input}>
      {left}
      <div className={style.MaskedInputWrapper}>
        <input
          {...props}
          ref={inputRef}
          defaultValue={defaultValue}
          value={value}
          onBlur={handleBlur}
          onScroll={(e) => {
            if (!e.currentTarget.matches(':focus')) {
              // don't let the user scroll the contents of the input when we aren't focused
              // or the mask will get out of sync with the input and cause things
              // to jump when the user focuses next
              e.preventDefault();
              inputRef.current?.scrollTo({
                behavior: 'instant',
                left: 0,
                top: 0,
              });
            }
          }}
        />
        <div className={style.MaskedInputDisplay} aria-hidden="true">
          {prefix}
          <span className={style.MaskedInputObscured}>{maskedSecret}</span>
        </div>
      </div>
      {right}
    </div>
  );
};
