import { Card, CardContent } from "@/components/ui/card";
import { formatFileSize } from "@/lib/utils";
import { Statistics } from "@/hooks/useCSVData";

interface DataStatisticsProps {
  statistics: Statistics;
  fileSize: number;
}

export default function DataStatistics({ statistics, fileSize }: DataStatisticsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Rows</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {statistics.totalRows.toLocaleString()}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Displayed Rows</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {statistics.displayedRows.toLocaleString()}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Columns</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {statistics.columns}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500">File Size</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatFileSize(fileSize)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
