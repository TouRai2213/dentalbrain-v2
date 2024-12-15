import React from 'react';

export function SubChart() {
  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">サブカルテ情報</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              主訴
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="患者の主訴を入力..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              現病歴
            </label>
            <textarea
              className="w-full h-24 p-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="現病歴の詳細を入力..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              既往歴
            </label>
            <textarea
              className="w-full h-24 p-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="既往歴の詳細を入力..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}