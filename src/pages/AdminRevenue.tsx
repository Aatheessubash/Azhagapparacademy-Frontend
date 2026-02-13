/**
 * Admin Revenue
 * Revenue analytics for administrators
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { formatINR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface RevenueResponse {
  totalRevenue: number;
  counts: { pending: number; approved: number; rejected: number; total: number };
  trend: { date: string; amount: number; count: number }[];
  topCourses: { courseId: string; title: string; revenue: number; payments: number }[];
  recentPayments: { _id: string; amount: number; userId: { name: string }; courseId: { title: string }; createdAt: string }[];
}

const periodOptions = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: 'all', label: 'All time' }
];

const AdminRevenue: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRevenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchRevenue = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getRevenue({ period });
      const payload = response.data;
      setData({
        totalRevenue: payload.totalRevenue || 0,
        counts: payload.counts || { pending: 0, approved: 0, rejected: 0, total: 0 },
        trend: payload.trend || [],
        topCourses: payload.topCourses || [],
        recentPayments: payload.recentPayments || []
      });
    } catch (error) {
      console.error('Failed to fetch revenue:', error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const renderBar = (amount: number, max: number) => {
    const width = max === 0 ? 0 : Math.max(6, Math.round((amount / max) * 100));
    return <div className="h-2 rounded-full bg-blue-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${width}%` }} /></div>;
  };

  const maxTrend = data?.trend.reduce((acc, t) => Math.max(acc, t.amount), 0) || 0;
  const maxTopCourse = data?.topCourses.reduce((acc, c) => Math.max(acc, c.revenue), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/admin')}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Revenue</h1>
            </div>
            <div className="flex items-center gap-2">
              {periodOptions.map((opt) => (
                <Button
                  key={opt.key}
                  variant={period === opt.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod(opt.key as typeof period)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !data ? (
          <p className="text-center text-gray-500">No revenue data.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatINR(data.totalRevenue)}</p>
                      <p className="text-xs text-gray-500">Approved payments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Approved</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{data.counts.approved}</p>
                    <p className="text-xs text-gray-500">Payments</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Pending</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">{data.counts.pending}</p>
                    <p className="text-xs text-gray-500">Awaiting review</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Rejected</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{data.counts.rejected}</p>
                    <p className="text-xs text-gray-500">Payments</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.trend.length === 0 ? (
                    <p className="text-sm text-gray-500">No approved payments in this period.</p>
                  ) : (
                    data.trend.map((item) => (
                      <div key={item.date} className="flex items-center gap-3">
                        <div className="w-28 text-sm text-gray-600">{item.date}</div>
                        <div className="flex-1">{renderBar(item.amount, maxTrend)}</div>
                        <div className="w-24 text-right text-sm font-medium">{formatINR(item.amount)}</div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Courses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.topCourses.length === 0 ? (
                    <p className="text-sm text-gray-500">No revenue yet.</p>
                  ) : (
                    data.topCourses.map((course) => (
                      <div key={course.courseId} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 line-clamp-1">{course.title}</p>
                          <Badge variant="secondary">{course.payments} payments</Badge>
                        </div>
                        {renderBar(course.revenue, maxTopCourse)}
                        <p className="text-sm text-gray-600">{formatINR(course.revenue)}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.recentPayments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-6 text-center text-gray-500">No payments yet.</td>
                        </tr>
                      ) : (
                        data.recentPayments.map((payment) => (
                          <tr key={payment._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.userId?.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.courseId?.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatINR(payment.amount)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminRevenue;
