import { useState } from 'react';
import { Button, ButtonProps, type ButtonVariant } from '@stainless-api/docs/components';
import { Plus } from 'lucide-react';
import { FlexBox } from './FlexBox';

function ButtonDisplay(props: ButtonProps) {
  return (
    <FlexBox direction="row">
      <Button {...props}>
        <Button.Icon icon={Plus} />
        <Button.Label>Add Item</Button.Label>
        <Button.Icon icon={Plus} />
      </Button>

      <Button {...props}>
        <Button.Icon icon={Plus} />
        <Button.Label>Add Item</Button.Label>
      </Button>

      <Button {...props}>
        <Button.Label>Add Item</Button.Label>
        <Button.Icon icon={Plus} />
      </Button>

      <Button {...props}>
        <Button.Label>Add Item</Button.Label>
      </Button>

      <Button {...props}>
        <Button.Icon icon={Plus} />
      </Button>
    </FlexBox>
  );
}

function ButtonSizes(props: ButtonProps) {
  const sizes: ButtonProps['size'][] = ['sm', 'default', 'lg'];

  return (
    <FlexBox direction="column">
      {sizes.map((size) => (
        <ButtonDisplay key={size} {...props} size={size} />
      ))}
    </FlexBox>
  );
}

export function AllButtonVariants() {
  const [border, setBorder] = useState(false);
  const [loading, setLoading] = useState(false);

  const variants: ButtonVariant[] = [
    'default',
    'outline',
    'ghost',
    'accent',
    'accent-muted',
    'muted',
    'success',
    'destructive',
  ];

  return (
    <>
      <div>
        <label>
          <input type="checkbox" checked={border} onChange={(e) => setBorder(e.target.checked)} /> Border
        </label>
        <br />
        <label>
          <input type="checkbox" checked={loading} onChange={(e) => setLoading(e.target.checked)} /> Loading
        </label>
      </div>

      <p>As buttons:</p>
      {variants.map((variant) => (
        <ButtonSizes
          key={variant}
          variant={variant}
          border={border}
          loading={loading ? { label: 'Loading...' } : undefined}
        />
      ))}

      <p>As links:</p>
      {variants.map((variant) => (
        <ButtonSizes
          key={variant}
          variant={variant}
          border={border}
          loading={loading ? { label: 'Loading...' } : undefined}
          href="https://stainless.com"
          target="_blank"
        />
      ))}
    </>
  );
}
