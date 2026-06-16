/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SurveyData {
  name: string;
  companyIp: string;
  aiTools: string[];
  aiFreq: string;
  aiUsage: string[];
  aiLevel: number;
  jobTasks: string[];
  jobTaskOtherText: string;  // Detail if Q6 "기타" is selected
  autoWants: string[];
  autoWantOtherText: string; // Detail if Q7 "기타" is selected
  timeSpent: string;
  autoDetail: string;
  expectation: string;
  freeOpinion: string;
}

export interface SubmissionRecord {
  id: string;
  timestamp: string;
  data: SurveyData;
  scriptUrlUsed?: string;
  submittedSuccessfully: boolean;
}
