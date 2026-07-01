import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface Props {
  title:    string;
  children: React.ReactNode;
}

export default function Shell({ title, children }: Props) {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar title={title} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
