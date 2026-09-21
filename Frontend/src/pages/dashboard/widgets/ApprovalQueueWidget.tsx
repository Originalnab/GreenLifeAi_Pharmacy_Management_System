import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { ApprovalRequest } from '../../../types';

interface ApprovalQueueWidgetProps {
  approvals: ApprovalRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  formatCurrency: (n: number) => string;
  maxItems?: number;
}

export const ApprovalQueueWidget: React.FC<ApprovalQueueWidgetProps> = ({
  approvals, onApprove, onReject, formatCurrency, maxItems = 5,
}) => {
  const pending = approvals.filter(a => a.status === 'PENDING').slice(0, maxItems);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Approval Work Queue</h3>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
              {pending.length} pending
            </span>
          )}
        </div>
        <Clock className="w-4 h-4 text-slate-400" />
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {pending.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            All items resolved.
          </div>
        ) : (
          pending.map(req => (
            <div key={req.id} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{req.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{req.details}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    By <span className="font-semibold text-slate-600 dark:text-slate-300">{req.requestedBy}</span>
                  </p>
                </div>
                {req.amount != null && (
                  <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400 flex-shrink-0">
                    {formatCurrency(req.amount)}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onApprove(req.id)}
                  className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg text-[11px] font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Authorize
                </button>
                <button
                  onClick={() => onReject(req.id)}
                  className="flex-1 flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 text-slate-600 dark:text-slate-300 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
