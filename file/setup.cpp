#include <iostream>
#include <cstdlib>
#include <sys/stat.h>
#include <fstream>
#include <vector>
#include <sstream>
#include <string>
#include <filesystem>
using std::cout;
using std::cerr;
using std::ostream;
using std::vector;
using std::string;
using std::ifstream;
using std::ofstream;
using std::getline;
using std::pair;
using std::istringstream;
using std::to_string;
vector<pair<string, string>> all;
vector<string> now;
string start;
struct endline{}endl;
inline ostream& operator<<(ostream& out, endline e){
	out.flush();
	out << '\r' << std::endl;
	return out;
}
inline bool directoryExists(const char* path) {
	struct stat info;
	if(stat(path, &info) != 0){
		return false;
	}else if(info.st_mode & S_IFDIR){
		return true;
	}else{
		return false;
	}
}
inline vector<pair<string, string>> read_all_list(){
	while(!all.empty()){
		all.pop_back();
	}
	ifstream infile("files/all_list.txt");
	if(!infile.good()){
		return all;
	}
	string line;
	while(getline(infile, line)){
		string name, path;
		istringstream iss(line);
		iss >> name >> path;
		path = "lyuwenhan.github.io" + path;
		all.push_back({name, path});
	}
	infile.close();
	return all;
}
inline vector<string> read_now_list(){
	while(!now.empty()){
		now.pop_back();
	}
	ifstream infile("files/downloaded.txt");
	if(!infile.good()){
		infile.close();
		system("touch files/downloaded.txt >/dev/null 2>&1");
		return now;
	}
	string line;
	while(getline(infile, line)){
		now.push_back(line);
	}
	infile.close();
	return now;
}
inline bool get_all_list(){
	return !system("wget -O files/all_list.txt https://lyuwenhan.github.io/file/list.txt >/dev/null 2>&1");
	read_all_list();
	read_now_list();
}
inline string read_start(){
	ifstream infile("files/start.txt");
	if(!infile.good()){
		infile.close();
		system("touch files/start.txt >/dev/null 2>&1");
		start = "";
		return "";
	}
	infile >> start;
	return start;
}
inline void clear(){
	system("clear");
}
inline char getch(){
	char c = getchar();
	if(c == 3){
		clear();
		cout << "^C" << endl;
		system("stty echo cooked");
		exit(1);
	}
	return c;
}
inline void sleep(double time){
	system(((string)"sleep " + to_string(time)).c_str());
}
inline void choose(){
	clear();
	if(now.empty()){
		cout << "没有已下载的版本" << endl;
		return;
	}
	int choose = 0;
	while(true){
		clear();
		cout << "已下载版本:" << endl;
		for(int i = 0; i < now.size(); i++){
			if(i != choose){
				cout << now[i] << ' ';
			}else{
				cout << "\033[32;1m" << now[i] << "\033[m ";
			}
		}
		cout << endl << "按a和d移动, 按enter确定" << endl;
		char c = getch();
		while(c != 'a' && c != 'd' && c != '\r'){
			c = getch();
		}
		if(c == 'a'){
			choose--;
			if(choose < 0){
				choose = now.size() - 1;
			}
		}else if(c == 'd'){
			choose++;
			if(choose == now.size()){
				choose = 0;
			}
		}else{
			ofstream out("files/start.txt");
			out << now[choose] << std::endl;
			start = now[choose];
			return;
		}
	}
}
inline void download(){
	get_all_list();
	clear();
	if(all.empty()){
		cout << "没有可下载的版本" << endl;
		return;
	}
	int choose = 0;
	while(true){
		clear();
		cout << "可下载版本:" << endl;
		for(int i = 0; i < all.size(); i++){
			if(i != choose){
				cout << all[i].first << ' ';
			}else{
				cout << "\033[32;1m" << all[i].first << "\033[m ";
			}
		}
		cout << endl << "按a和d移动, 按enter确定" << endl;
		char c = getch();
		while(c != 'a' && c != 'd' && c != '\r'){
			c = getch();
		}
		if(c == 'a'){
			choose--;
			if(choose < 0){
				choose = all.size() - 1;
			}
		}else if(c == 'd'){
			choose++;
			if(choose == all.size()){
				choose = 0;
			}
		}else{
			clear();
			cout << "下载中" << endl;
			bool b = system(((string)"wget -O files/" + all[choose].first + ".zip " + all[choose].second + ">/dev/null 2>&1").c_str());
			clear();
			if(b){
				cout << "下载失败" << endl;
				return;
			}
			{
				std::ofstream out("files/downloaded.txt", std::ios_base::app);
				out << all[choose].first << std::endl;
			}
			system("sort -u files/downloaded.txt -o files/downloaded.txt >/dev/null 2>&1");
			system(((string)"unzip files/" + all[choose].first + ".zip -d files/ >/dev/null 2>&1").c_str());
			cout << "下载成功" << endl;
			return;
		}
	}
}
int main(){
	clear();
	system("stty -echo raw");
	system("mkdir files >/dev/null 2>&1");
	if(!directoryExists("files")){
		cerr << "保存文件夹缺失, 请手动创建名为\"files\"的文件夹" << endl;
		system("stty echo cooked");
		return 1;
	}
	read_now_list();
	read_all_list();
	read_start();
	while(true){
		clear();
		read_now_list();
		read_all_list();
		read_start();
		cout << "fishing launcher" << endl << "1.启动当前版本, 2.切换版本, 3.下载其他版本, 4.刷新列表, 5.退出" << endl << "已下载版本:" << endl;
		if(now.empty()){
			cout << "无" << endl;
		}else{
			for(string i : now){
				cout << i << ' ';
			}
			cout << endl;
		}
		cout << "当前启动版本: " << (start.empty() ? "无" : start) << endl;
		char c = getch();
		while(c != '1' && c != '2' && c != '3' && c != '4' && c != '5'){
			c = getch();
		}
		if(c == '1'){
			if(start.empty()){
				cout << "请选择版本" << endl;
				sleep(1);
				continue;
			}
			{
				ofstream out("files/setup.sh");
				out << "cd files/" << start << std::endl;
				out << "./setup.sh" << std::endl;
			}
			system("stty echo cooked");
			system("./files/setup.sh");
			system("stty -echo raw");
			sleep(1);
			continue;
		}else if(c == '2'){
			choose();
			sleep(1);
			continue;
		}else if(c == '3'){
			download();
			sleep(1);
			continue;
		}else if(c == '4'){
			clear();
			cout << "获取中" << endl;
			get_all_list();
			read_now_list();
			read_all_list();
			read_start();
			continue;
		}else if(c == '5'){
			break;
		}
	}
	clear();
	system("stty echo cooked");
	return 0;
}
