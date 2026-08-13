import React from 'react';
import {Notice} from '../../../components';
import {NoticeState} from '../utils/authErrors';

type AuthNoticeProps = {
  notice: NoticeState;
  onDismiss: () => void;
};

export function AuthNotice({notice, onDismiss}: AuthNoticeProps): React.JSX.Element {
  return <Notice title={notice.title} message={notice.message} tone={notice.tone} onDismiss={onDismiss} />;
}
