import boto3
import datetime

def fetch_logs(log_group, start_time_minutes_ago=10, log_keywords=['ERROR', 'FAIL', 'WARNING', 'WARN']):
    """
    Fetch and filter logs containing specified keywords from AWS CloudWatch.

    :param log_group: The name of the log group in CloudWatch.
    :param start_time_minutes_ago: How far back to start fetching logs (in minutes).
    :param log_keywords: List of keywords to search for in logs to identify errors and warnings.
    :return: String containing the full log entries that contain the specified keywords.
    """
    client = boto3.client('logs')
    end_time = int(datetime.datetime.now().timestamp() * 1000)
    start_time = int((datetime.datetime.now() - datetime.timedelta(minutes=start_time_minutes_ago)).timestamp() * 1000)

    try:
        response = client.filter_log_events(
            logGroupName=log_group,
            startTime=start_time,
            endTime=end_time
        )
        events = response.get('events', [])
        relevant_logs = []

        for event in events:
            if any(keyword in event['message'] for keyword in log_keywords):
                relevant_logs.append(event['message'])

        if relevant_logs:
            return f"\n========== Logs (Errors/Warnings) from {log_group} ==========\n" + '\n'.join(relevant_logs)
        else:
            return f"\n========== No Errors/Warnings Found in {log_group} =========="

    except Exception as e:
        print(f"Error fetching logs: {e}")
        return f"\n========== Error fetching logs from {log_group} =========="

# Example usage
if __name__ == "__main__":
    log_groups = [
        '/aws/elasticbeanstalk/Gtimenu-Prod/var/log/eb-engine.log',
        '/aws/elasticbeanstalk/Gtimenu-Prod/var/log/web.stdout.log'
    ]

    all_filtered_logs = [fetch_logs(log_group) for log_group in log_groups]
    combined_filtered_logs = "\n".join(all_filtered_logs)
    print(combined_filtered_logs)
