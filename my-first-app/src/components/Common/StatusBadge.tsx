import { getStatusMeta, type StatusEntity } from '../../constants/statusLabels';

interface StatusBadgeProps {
  entity: StatusEntity;
  value: string;
}

const StatusBadge = ({ entity, value }: StatusBadgeProps) => {
  const { label, className } = getStatusMeta(entity, value);

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded border ${className}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
