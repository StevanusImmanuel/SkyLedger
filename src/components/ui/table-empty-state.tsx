import React from 'react';
import { SearchX, LucideIcon } from 'lucide-react';

interface TableEmptyStateProps {
  colSpan: number;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  altDescription?: string;
}

export function TableEmptyState({
  colSpan,
  icon: Icon = SearchX,
  title = 'No Results Found',
  description = "We couldn't find any records matching your search criteria.",
  altDescription = 'Try adjusting your search keywords or filters.',
}: TableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            textAlign: 'center',
            background: '#ffffff',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#f0f4ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: '#1a2d5a',
            }}
          >
            <Icon size={32} strokeWidth={1.8} />
          </div>
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: 800,
              color: '#1a2d5a',
              letterSpacing: '-0.2px',
            }}
          >
            {title}
          </h3>
          <p
            style={{
              margin: '0 0 4px 0',
              fontSize: '13px',
              fontWeight: 600,
              color: '#64748b',
              maxWidth: '320px',
              lineHeight: '1.5',
            }}
          >
            {description}
          </p>
          {altDescription && (
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: 500,
                color: '#94a3b8',
              }}
            >
              {altDescription}
            </p>
          )}
        </div>
      </td>
    </tr>
  );
}
