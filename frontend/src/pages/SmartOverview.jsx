import StudentOverview from './student/Overview';
import AdminOverview from './admin/AdminOverview';
import TeacherOverview from './teacher/TeacherOverview';

export default function SmartOverview() {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const role = user.role || 'student';

  if (role === 'admin') return <AdminOverview />;
  if (role === 'teacher') return <TeacherOverview />;
  return <StudentOverview />;
}
