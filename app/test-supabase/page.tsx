import { createSupabaseClient } from "@/lib/supabase";

export default async function TestSupabasePage() {
  console.log("🔍 Supabase 데이터 조회 시작");

  try {
    const supabase = createSupabaseClient();

    // 1. 테이블 목록 조회
    console.log("📋 테이블 목록 조회 중...");
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'schema_migrations');

    if (tablesError) {
      console.error("❌ 테이블 목록 조회 실패:", tablesError);
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Supabase 테스트</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>테이블 목록 조회 실패: {tablesError.message}</p>
          </div>
        </div>
      );
    }

    console.log("✅ 테이블 목록:", tables);

    // 2. users 테이블 데이터 조회
    console.log("👥 users 테이블 데이터 조회 중...");
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(10);

    if (usersError) {
      console.error("❌ users 테이블 조회 실패:", usersError);
    } else {
      console.log("✅ users 데이터:", users);
    }

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Supabase 데이터 조회 결과</h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">📋 테이블 목록</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm">{JSON.stringify(tables, null, 2)}</pre>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">👥 Users 테이블 데이터</h2>
          {usersError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>users 데이터 조회 실패: {usersError.message}</p>
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded">
              <p className="mb-2 text-sm text-gray-600">총 {users?.length || 0}개 데이터</p>
              <pre className="text-sm">{JSON.stringify(users, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold mb-2">💡 콘솔 로그 확인</h3>
          <p className="text-sm text-gray-700">
            브라우저 개발자 도구의 Console 탭에서 더 자세한 로그를 확인할 수 있습니다.
          </p>
        </div>
      </div>
    );

  } catch (error) {
    console.error("❌ 전체 오류:", error);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Supabase 테스트</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>오류 발생: {error instanceof Error ? error.message : '알 수 없는 오류'}</p>
        </div>
      </div>
    );
  }
}
