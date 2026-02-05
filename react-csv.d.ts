declare module 'react-csv' {
  import * as React from 'react';

  interface CSVLinkProps {
    data: Array<Record<string, unknown>>;
    headers?: Array<{ label: string; key: string }>;
    filename?: string;
    className?: string;
    target?: string;
    children?: React.ReactNode;
  }

  export class CSVLink extends React.Component<CSVLinkProps> {}
}
